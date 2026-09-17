import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import {
  readSyncMessage,
  writeSyncStep1,
  writeUpdate,
} from "y-protocols/sync";
import { applyAwarenessUpdate, Awareness, encodeAwarenessUpdate } from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import fs from "node:fs";
import path from "node:path";

const HOST = process.env.HOST || "localhost";
const PORT = Number(process.env.PORT || 1234);
const PERSIST_DIR = process.env.PERSIST_DIR || "./dbDir";

// Message types (must match y-websocket client)
const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

// Ensure persistence directory exists
if (!fs.existsSync(PERSIST_DIR)) {
  fs.mkdirSync(PERSIST_DIR, { recursive: true });
}

/**
 * Each document room holds:
 *  - a Y.Doc (the CRDT)
 *  - an Awareness instance (cursor/presence data)
 *  - a Set of connected WebSocket clients
 */
const docs = new Map();

function getDoc(docName) {
  if (docs.has(docName)) return docs.get(docName);

  const ydoc = new Y.Doc();
  const awareness = new Awareness(ydoc);
  const conns = new Set();

  // Load persisted state if it exists
  const filePath = path.join(PERSIST_DIR, `${docName}.yjs`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    Y.applyUpdate(ydoc, data);
    console.log(`  📂 Loaded persisted doc: ${docName}`);
  }

  // Persist on every update
  ydoc.on("update", () => {
    const state = Y.encodeStateAsUpdate(ydoc);
    fs.writeFileSync(filePath, state);
  });

  // Clean up awareness when clients disconnect
  awareness.on("update", ({ added, updated, removed }) => {
    const changedClients = [...added, ...updated, ...removed];
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      encodeAwarenessUpdate(awareness, changedClients)
    );
    const msg = encoding.toUint8Array(encoder);

    conns.forEach((conn) => {
      if (conn.readyState === WebSocket.OPEN) {
        conn.send(msg);
      }
    });
  });

  const room = { ydoc, awareness, conns };
  docs.set(docName, room);
  return room;
}

function handleConnection(conn, docName) {
  const room = getDoc(docName);
  room.conns.add(conn);

  // Send sync step 1 (full document state)
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MSG_SYNC);
  writeSyncStep1(syncEncoder, room.ydoc);
  conn.send(encoding.toUint8Array(syncEncoder));

  // Send current awareness state
  const awarenessStates = room.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      encodeAwarenessUpdate(room.awareness, [
        ...awarenessStates.keys(),
      ])
    );
    conn.send(encoding.toUint8Array(awarenessEncoder));
  }

  conn.on("message", (data) => {
    try {
      const buf = new Uint8Array(data);
      const decoder = decoding.createDecoder(buf);
      const msgType = decoding.readVarUint(decoder);

      switch (msgType) {
        case MSG_SYNC: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MSG_SYNC);
          readSyncMessage(decoder, encoder, room.ydoc, conn);
          const reply = encoding.toUint8Array(encoder);
          // If there's a reply (sync step 2), send it back
          if (encoding.length(encoder) > 1) {
            conn.send(reply);
          }
          // Broadcast document updates to other clients
          if (buf.length > 1) {
            room.conns.forEach((other) => {
              if (other !== conn && other.readyState === WebSocket.OPEN) {
                other.send(buf);
              }
            });
          }
          break;
        }
        case MSG_AWARENESS: {
          applyAwarenessUpdate(
            room.awareness,
            decoding.readVarUint8Array(decoder),
            conn
          );
          break;
        }
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  });

  conn.on("close", () => {
    room.conns.delete(conn);
    // Remove awareness state for this connection
    if (room.awareness.states.has(conn)) {
      room.awareness.removeStates(
        [conn],
        "connection closed"
      );
    }
    // Clean up empty rooms after delay
    if (room.conns.size === 0) {
      setTimeout(() => {
        if (room.conns.size === 0) {
          room.ydoc.destroy();
          docs.delete(docName);
          console.log(`  🗑  Room closed: ${docName}`);
        }
      }, 30000);
    }
  });

  console.log(
    `  👤 User joined "${docName}" (${room.conns.size} connected)`
  );
}

// HTTP + WebSocket server
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        rooms: docs.size,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Synora Collaboration Server");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  // Extract document name from URL path: /docName
  const docName = (req.url || "/").slice(1).split("?")[0] || "default";
  handleConnection(conn, docName);
});

server.listen(PORT, HOST, () => {
  console.log(`\n🟢 Synora Collaboration Server running`);
  console.log(`   WebSocket: ws://${HOST}:${PORT}`);
  console.log(`   Health:    http://${HOST}:${PORT}/health`);
  console.log(`   Persistence: ${PERSIST_DIR}\n`);
});
