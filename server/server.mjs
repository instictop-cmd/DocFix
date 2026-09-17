import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import {
  readSyncMessage,
  writeSyncStep1,
  writeUpdate,
} from "y-protocols/sync";
import {
  applyAwarenessUpdate,
  Awareness,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import fs from "node:fs";
import path from "node:path";

const HOST = process.env.HOST || "localhost";
const PORT = Number(process.env.PORT || 1234);
const PERSIST_DIR = process.env.PERSIST_DIR || "./dbDir";

// Message types (Standard Yjs protocol)
const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

// Ensure persistence directory exists
if (!fs.existsSync(PERSIST_DIR)) {
  fs.mkdirSync(PERSIST_DIR, { recursive: true });
}

/**
 * Storage of active rooms.
 * Key: docName (string)
 * Value: { ydoc, awareness, conns (Set<WebSocket>), controlledUserIds (Map<WebSocket, Set<number>>) }
 */
const docs = new Map();

function getDoc(docName) {
  if (docs.has(docName)) return docs.get(docName);

  const ydoc = new Y.Doc();
  const awareness = new Awareness(ydoc);
  const conns = new Set();
  const connsToClients = new Map(); // conn -> Set of clientIDs controlled by this conn

  // Load persisted state if it exists
  const filePath = path.join(PERSIST_DIR, `${docName}.yjs`);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath);
      Y.applyUpdate(ydoc, data);
      console.log(`  📂 Loaded persisted CRDT doc: "${docName}"`);
    } catch (err) {
      console.error(`  ⚠️ Could not read persisted doc "${docName}":`, err);
    }
  }

  // 1. Broadcast Document Updates to all peers (except origin)
  ydoc.on("update", (update, origin) => {
    // Save state to disk
    try {
      const state = Y.encodeStateAsUpdate(ydoc);
      fs.writeFileSync(filePath, state);
    } catch (e) {
      console.error("Failed to write persistence:", e);
    }

    // Broadcast the delta update to all other connected clients
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    conns.forEach((client) => {
      if (client !== origin && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // 2. Broadcast Awareness / Cursors updates to all peers (except origin)
  awareness.on("update", ({ added, updated, removed }, origin) => {
    const changedClients = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      encodeAwarenessUpdate(awareness, changedClients)
    );
    const message = encoding.toUint8Array(encoder);

    conns.forEach((client) => {
      if (client !== origin && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  const room = { ydoc, awareness, conns, connsToClients };
  docs.set(docName, room);
  return room;
}

function handleConnection(conn, docName) {
  const room = getDoc(docName);
  room.conns.add(conn);
  room.connsToClients.set(conn, new Set());

  // Set binary type for WebSocket
  conn.binaryType = "arraybuffer";

  // Step 1: Send Initial Sync Step 1 to new connection
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MSG_SYNC);
  writeSyncStep1(syncEncoder, room.ydoc);
  conn.send(encoding.toUint8Array(syncEncoder));

  // Step 2: Send Current Awareness / Active Cursors to new connection
  const awarenessStates = room.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      encodeAwarenessUpdate(room.awareness, Array.from(awarenessStates.keys()))
    );
    conn.send(encoding.toUint8Array(awarenessEncoder));
  }

  // Handle incoming messages from this connection
  conn.on("message", (data) => {
    try {
      const buf = new Uint8Array(data);
      const decoder = decoding.createDecoder(buf);
      const msgType = decoding.readVarUint(decoder);

      switch (msgType) {
        case MSG_SYNC: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MSG_SYNC);
          // Applies the update to room.ydoc with origin = conn (which triggers ydoc.on("update") broadcast!)
          readSyncMessage(decoder, encoder, room.ydoc, conn);
          
          // If readSyncMessage generated a reply (e.g. SyncStep2 response to SyncStep1), send it back
          if (encoding.length(encoder) > 1) {
            conn.send(encoding.toUint8Array(encoder));
          }
          break;
        }

        case MSG_AWARENESS: {
          // Track client IDs in awareness update for this connection
          const update = decoding.readVarUint8Array(decoder);
          
          // Track clientIDs controlled by this connection
          try {
            const tempDecoder = decoding.createDecoder(update);
            const len = decoding.readVarUint(tempDecoder);
            for (let i = 0; i < len; i++) {
              const clientID = decoding.readVarUint(tempDecoder);
              decoding.readVarUint(tempDecoder); // clock
              decoding.readVarString(tempDecoder); // state
              room.connsToClients.get(conn)?.add(clientID);
            }
          } catch {}

          // Apply awareness update with origin = conn (which triggers awareness.on("update") broadcast!)
          applyAwarenessUpdate(room.awareness, update, conn);
          break;
        }
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  // Handle connection close
  conn.on("close", () => {
    room.conns.delete(conn);
    const controlledClients = room.connsToClients.get(conn);
    room.connsToClients.delete(conn);

    if (controlledClients && controlledClients.size > 0) {
      removeAwarenessStates(
        room.awareness,
        Array.from(controlledClients),
        null
      );
    }

    console.log(
      `  👋 Client left room "${docName}" (${room.conns.size} connected)`
    );

    // If room is empty, preserve to disk and schedule cleanup
    if (room.conns.size === 0) {
      setTimeout(() => {
        if (room.conns.size === 0) {
          room.ydoc.destroy();
          room.awareness.destroy();
          docs.delete(docName);
          console.log(`  🗑️ Room cleared from memory: "${docName}"`);
        }
      }, 60000);
    }
  });

  console.log(
    `  👤 Client connected to "${docName}" (${room.conns.size} active)`
  );
}

// HTTP Server
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        activeRooms: docs.size,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("DocFix Yjs Collaboration Server Online");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  // Extract document room from URL (e.g., /document-uuid-1234)
  const urlPath = req.url || "/";
  const docName = urlPath.slice(1).split("?")[0] || "default";
  handleConnection(conn, docName);
});

server.listen(PORT, HOST, () => {
  console.log(`\n🟢 DocFix Collaboration Server running`);
  console.log(`   WebSocket: ws://${HOST}:${PORT}`);
  console.log(`   Health:    http://${HOST}:${PORT}/health`);
  console.log(`   Persistence: ${PERSIST_DIR}\n`);
});
