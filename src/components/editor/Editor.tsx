"use client";
"use no memo";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import Underline from "@tiptap/extension-underline";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { useEffect, useMemo, useState, useCallback } from "react";
import Toolbar from "./Toolbar";
import OnlineUsers from "../presence/OnlineUsers";

// Colors for user cursors
const COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

interface CollaborativeEditorProps {
  documentId: string;
  userName: string;
}

export default function CollaborativeEditor({
  documentId,
  userName,
}: CollaborativeEditorProps) {
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [synced, setSynced] = useState(false);

  // Create Yjs document and providers — stable across re-renders
  const { ydoc, wsProvider, userColor } = useMemo(() => {
    const doc = new Y.Doc();
    const color = getRandomColor();

    // WebSocket provider — connects to our collaboration server
    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      documentId,
      doc
    );

    // IndexedDB persistence — saves document locally for offline support
    new IndexeddbPersistence(documentId, doc);

    return { ydoc: doc, wsProvider: provider, userColor: color };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Track connection status
  useEffect(() => {
    const onStatus = (event: { status: string }) => {
      setStatus(event.status as "connecting" | "connected" | "disconnected");
    };
    const onSync = (isSynced: boolean) => {
      setSynced(isSynced);
    };

    wsProvider.on("status", onStatus);
    wsProvider.on("sync", onSync);

    return () => {
      wsProvider.off("status", onStatus);
      wsProvider.off("sync", onSync);
    };
  }, [wsProvider]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [wsProvider, ydoc]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          // Undo/Redo is handled by Yjs (collaborative history)
          // In TipTap v3, "history" was renamed to "undoRedo"
          undoRedo: false,
        }),
        Underline,
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCaret.configure({
          provider: wsProvider,
          user: {
            name: userName,
            color: userColor,
          },
        }),
      ],
      shouldRerenderOnTransaction: true,
    },
    [ydoc, wsProvider]
  );

  // Toggle connection for demo purposes
  const toggleConnection = useCallback(() => {
    if (status === "connected") {
      wsProvider.disconnect();
    } else {
      wsProvider.connect();
    }
  }, [status, wsProvider]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-800">📝 Synora</h1>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                status === "connected"
                  ? "bg-green-500"
                  : status === "connecting"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-500 capitalize">
              {status}
              {status === "connected" && synced ? " · Synced" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Demo button: simulate offline/online */}
          <button
            type="button"
            onClick={toggleConnection}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              status === "connected"
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            }`}
          >
            {status === "connected" ? "⚡ Go Offline" : "🔌 Reconnect"}
          </button>

          <OnlineUsers editor={editor} />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar editor={editor} />

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto bg-gray-100">
        <div className="max-w-4xl mx-auto my-8 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[700px]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
