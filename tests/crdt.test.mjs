/**
 * CRDT correctness tests for DocFix.
 *
 * These prove the core claim of the project: that Yjs documents converge
 * to an identical state regardless of the order in which updates arrive —
 * under out-of-order delivery, concurrent edits, deletes, and the
 * persistence round-trip the collab server (server/server.mjs) performs.
 *
 * Runs in plain Node (no browser) — the CRDT layer (yjs ^13 +
 * y-protocols/sync + lib0) is the same code the ws relay uses.
 */
import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import { readSyncMessage, writeUpdate } from "y-protocols/sync";

/* Message type tag used on the ws wire (see server/server.mjs).
 * Kept as a literal here so these tests pin the protocol contract
 * instead of importing from unexported server internals. */
const MSG_SYNC = 0;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/** Attach an update listener BEFORE edits; returns a collector. */
function capture(doc) {
  const out = [];
  doc.on("update", (u) => out.push(u));
  return out;
}

/** Apply a batch of updates in an arbitrary (shuffled) order. */
function applyShuffled(doc, updates) {
  for (const u of [...updates].sort(() => Math.random() - 0.5)) {
    Y.applyUpdate(doc, u);
  }
}

const text = (doc, field = "doc") => doc.getText(field).toString();

/* ------------------------------------------------------------------ */
/* convergence                                                         */
/* ------------------------------------------------------------------ */

describe("CRDT convergence", () => {
  it("three clients that edited offline all converge to the same state", () => {
    const A = new Y.Doc();
    const B = new Y.Doc();
    const C = new Y.Doc();
    const cA = capture(A);
    const cB = capture(B);
    const cC = capture(C);

    A.getText("doc").insert(0, "The quick brown fox");
    B.getText("doc").insert(0, "jumps over the lazy dog");
    C.getText("doc").insert(0, " — and kept every keystroke.");

    // All edits flow into every client via the relay, in arbitrary order.
    const all = [...cA, ...cB, ...cC];
    applyShuffled(A, all);
    applyShuffled(B, all);
    applyShuffled(C, all);

    expect(text(A)).toBe(text(B));
    expect(text(B)).toBe(text(C));
    for (const expected of [
      "The quick brown fox",
      "jumps over the lazy dog",
    ]) {
      expect(text(A)).toContain(expected);
    }
  });

  it("concurrent typing in the same gap loses no characters", () => {
    // Shared baseline: what two users see after an initial sync.
    const base = new Y.Doc();
    base.getText("doc").insert(0, "AB");

    const A = new Y.Doc();
    const B = new Y.Doc();
    Y.applyUpdate(A, Y.encodeStateAsUpdate(base));
    Y.applyUpdate(B, Y.encodeStateAsUpdate(base));
    const cA = capture(A);
    const cB = capture(B);

    // Two users type at cursor position 1 at the same moment.
    A.getText("doc").insert(1, "X");
    B.getText("doc").insert(1, "Y");

    const merged = new Y.Doc();
    Y.applyUpdate(merged, Y.encodeStateAsUpdate(base));
    applyShuffled(merged, [...cA, ...cB]);

    // A-?-?-B: both keystrokes survive; their relative order is
    // deterministic once converged (clientID tie-break), never lost.
    expect(text(merged).length).toBe(4);
    expect(text(merged).startsWith("A")).toBe(true);
    expect(text(merged).endsWith("B")).toBe(true);
    expect(text(merged).includes("X")).toBe(true);
    expect(text(merged).includes("Y")).toBe(true);
  });

  it("concurrent delete + insert (tombstones) converge", () => {
    const A = new Y.Doc();
    A.getText("doc").insert(0, "collab");
    const base = Y.encodeStateAsUpdate(A);

    const B = new Y.Doc();
    Y.applyUpdate(B, base);
    const cA = capture(A);
    const cB = capture(B);

    // A deletes a range while B appends past its end.
    A.getText("doc").delete(1, 3); // removes "oll"
    B.getText("doc").insert(6, "!");

    const merged = new Y.Doc();
    Y.applyUpdate(merged, base);
    applyShuffled(merged, [...cA, ...cB]);
    expect(text(merged)).toBe("cab!");
  });

  it("late-arriving (out-of-order) updates still converge", () => {
    const A = new Y.Doc();
    A.getText("doc").insert(0, "A");
    const u1 = Y.encodeStateAsUpdate(A); // may be delayed by the network

    // A keeps editing before u1 reaches the relay.
    A.getText("doc").insert(1, "B");
    A.getText("doc").delete(0, 1);
    const u2 = Y.encodeStateAsUpdate(A); // newer state replaces "A" with "B"

    // Receiver gets u2 first, then the stale u1.
    const R = new Y.Doc();
    Y.applyUpdate(R, u2);
    expect(text(R)).toBe("B");
    Y.applyUpdate(R, u1); // stale update must not resurrect deleted text
    expect(text(R)).toBe("B");
  });

  it("persistence round-trip (dbDir save/reload semantics) preserves document state", () => {
    // Mirrors server/server.mjs: Y.encodeStateAsUpdate -> fs.writeFileSync,
    // then a fresh Y.Doc applies the buffer on load.
    const S = new Y.Doc();
    S.getText("doc").insert(0, "persisted collaborative document");
    S.getText("doc").delete(0, 10); // tombstones in the middle
    S.getMap("meta").set("title", "DocFix");

    const snapshot = Y.encodeStateAsUpdate(S); // what lands in dbDir/*.yjs
    const L = new Y.Doc();
    Y.applyUpdate(L, snapshot);

    expect(text(L)).toBe(text(S));
    expect(L.getMap("meta").get("title")).toBe("DocFix");
    // State vectors equal: identical logical content AND history.
    expect(Y.encodeStateVector(L)).toEqual(Y.encodeStateVector(S));
  });

  it("the ws relay handshake (y-protocols/sync writeUpdate + readSyncMessage) delivers a full doc", () => {
    // Reproduces server/server.mjs's update path at the message level:
    // a client frames a SYNC update message exactly like the wire format
    // (varUint type tag + sync payload); the relay's readSyncMessage
    // applies it to the room doc and encodes a reply.
    const client = new Y.Doc();
    client.getText("doc").insert(0, "hello from the client");
    const room = new Y.Doc();

    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, MSG_SYNC);
    writeUpdate(enc, Y.encodeStateAsUpdate(client));
    const message = encoding.toUint8Array(enc);

    const dec = decoding.createDecoder(message);
    const msgType = decoding.readVarUint(dec);
    expect(msgType).toBe(MSG_SYNC);
    const reply = encoding.createEncoder();
    readSyncMessage(dec, reply, room, "relay", {});

    expect(text(room)).toBe("hello from the client");
    // The relay processed the client's update: its state vector now
    // includes the client's clock. (A pure update message writes no
    // reply — broadcasts are separate from the sync handshake.)
    const roomState = Y.decodeStateVector(Y.encodeStateVector(room));
    expect(roomState.get(client.clientID)).toBe(
      Y.decodeStateVector(Y.encodeStateVector(client)).get(client.clientID),
    );
  });
});
