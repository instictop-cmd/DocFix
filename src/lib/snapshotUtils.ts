import * as Y from "yjs";
import { Editor } from "@tiptap/react";

export interface DocSnapshot {
  id: string;
  name: string;
  author: string;
  timestamp: number;
  wordCount: number;
  contentHTML: string;
  contentText: string;
}

/**
 * Creates a version snapshot and pushes it to the Yjs version_history array.
 * Returns the created snapshot, or null if the content hasn't changed since the last snapshot.
 */
export function createSnapshot(
  ydoc: Y.Doc,
  editor: Editor,
  author: string,
  label: string,
  options?: { skipDuplicateCheck?: boolean }
): DocSnapshot | null {
  const historyArray = ydoc.getArray<DocSnapshot>("version_history");
  const html = editor.getHTML();
  const text = editor.getText();
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  // Skip if content hasn't changed since last snapshot (unless forced)
  if (!options?.skipDuplicateCheck) {
    const allSnapshots = historyArray.toArray();
    if (allSnapshots.length > 0) {
      // Find the most recent snapshot by timestamp
      const latest = allSnapshots.reduce((a, b) =>
        a.timestamp > b.timestamp ? a : b
      );
      if (latest.contentText === text) {
        return null; // No changes since last snapshot
      }
    }
  }

  const newSnapshot: DocSnapshot = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: label,
    author,
    timestamp: Date.now(),
    wordCount: words,
    contentHTML: html,
    contentText: text,
  };

  historyArray.push([newSnapshot]);

  // Auto-prune: keep only the last 30 snapshots to avoid memory bloat
  const total = historyArray.length;
  if (total > 30) {
    // Find and remove the oldest auto-save entries (keep manual ones longer)
    const all = historyArray.toArray();
    const autoSaves = all
      .map((snap, index) => ({ snap, index }))
      .filter((item) => item.snap.name.startsWith("🔄 Auto-save"));

    if (autoSaves.length > 20) {
      // Remove the oldest auto-saves beyond 20
      const toRemove = autoSaves.slice(0, autoSaves.length - 20);
      // Remove in reverse order so indices stay valid
      for (let i = toRemove.length - 1; i >= 0; i--) {
        historyArray.delete(toRemove[i].index, 1);
      }
    }
  }

  return newSnapshot;
}
