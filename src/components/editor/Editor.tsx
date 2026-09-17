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
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Toolbar from "./Toolbar";
import OnlineUsers from "../presence/OnlineUsers";
import DiagnosticsHUD from "../diagnostics/DiagnosticsHUD";
import {
  FileText,
  Clock,
  Wifi,
  WifiOff,
  Radio,
  Eye,
  CheckCircle2,
  Lock,
} from "lucide-react";

// Pre-defined color palette
const COLORS = [
  "#2563EB", // Blue
  "#DC2626", // Red
  "#059669", // Emerald
  "#D97706", // Amber
  "#7C3AED", // Purple
  "#DB2777", // Pink
  "#0891B2", // Cyan
  "#EA580C", // Orange
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

interface CollaborativeEditorProps {
  documentId: string;
  userName: string;
  userRole?: "editor" | "viewer";
}

export default function CollaborativeEditor({
  documentId,
  userName,
  userRole = "editor",
}: CollaborativeEditorProps) {
  const isReadOnly = userRole === "viewer";
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [synced, setSynced] = useState(false);
  const [title, setTitle] = useState("Untitled Document");
  const [isDark, setIsDark] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [followingUser, setFollowingUser] = useState<string | null>(null);
  const [networkCondition, setNetworkCondition] = useState<"normal" | "lag" | "offline">("normal");

  // Word count & stats
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("docfix-theme");
    if (savedTheme === "dark") {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("docfix-theme", next ? "dark" : "light");
  };

  // Create Yjs document and providers — stable across re-renders
  const { ydoc, wsProvider, userColor, yMeta } = useMemo(() => {
    const doc = new Y.Doc();
    const color = getRandomColor();
    const meta = doc.getMap("meta");

    // WebSocket provider — connects to our collaboration server
    const provider = new WebsocketProvider("ws://localhost:1234", documentId, doc);

    // IndexedDB persistence — saves document locally for offline support
    new IndexeddbPersistence(documentId, doc);

    return { ydoc: doc, wsProvider: provider, userColor: color, yMeta: meta };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Sync document title with Yjs map and localStorage
  useEffect(() => {
    const updateTitleFromYjs = () => {
      let remoteTitle = (yMeta.get("title") as string) || "";
      
      // If Yjs doesn't have a title yet, check if we created one on the Dashboard
      if (!remoteTitle) {
        try {
          const saved = localStorage.getItem("synora-documents");
          if (saved) {
            const docs = JSON.parse(saved);
            const found = docs.find((d: { id: string; title: string }) => d.id === documentId);
            if (found && found.title) {
              remoteTitle = found.title;
              if (!isReadOnly) {
                yMeta.set("title", remoteTitle);
              }
            }
          }
        } catch {
          // Ignore
        }
      }

      const finalTitle = remoteTitle || "Untitled Document";
      setTitle(finalTitle);

      try {
        const saved = localStorage.getItem("synora-documents");
        if (saved) {
          const docs = JSON.parse(saved);
          const updated = docs.map((d: { id: string; title: string }) =>
            d.id === documentId ? { ...d, title: finalTitle } : d
          );
          localStorage.setItem("synora-documents", JSON.stringify(updated));
        }
      } catch (e) {
        console.error("Failed to update title in localStorage", e);
      }
    };

    yMeta.observe(updateTitleFromYjs);
    updateTitleFromYjs();

    return () => {
      yMeta.unobserve(updateTitleFromYjs);
    };
  }, [yMeta, documentId, isReadOnly]);

  const handleTitleChange = (newTitle: string) => {
    if (isReadOnly) return;
    setTitle(newTitle);
    yMeta.set("title", newTitle);
  };

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
      editable: !isReadOnly,
      extensions: [
        StarterKit.configure({
          undoRedo: false, // Collaborative history handled by Yjs
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
      onUpdate: ({ editor: ed }) => {
        const text = ed.getText();
        setCharCount(text.length);
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        setWordCount(words);
      },
    },
    [ydoc, wsProvider, isReadOnly]
  );

  // Follow User Mode: scroll to remote caret
  const handleFollowUser = useCallback(
    (targetName: string) => {
      if (followingUser === targetName) {
        setFollowingUser(null);
        return;
      }
      setFollowingUser(targetName);

      // Find remote caret element in DOM and smooth scroll
      const labels = document.querySelectorAll(".collaboration-carets__label");
      labels.forEach((label) => {
        if (label.textContent?.includes(targetName)) {
          label.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    },
    [followingUser]
  );

  // Connection toggler & Chaos Mode handler
  const handleNetworkChange = useCallback(
    (condition: "normal" | "lag" | "offline") => {
      setNetworkCondition(condition);
      if (condition === "offline") {
        wsProvider.disconnect();
      } else {
        if (!wsProvider.wsconnected) {
          wsProvider.connect();
        }
      }
    },
    [wsProvider]
  );

  if (!editor) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDark ? "bg-gray-950 text-gray-300" : "bg-gray-50 text-gray-700"}`}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-sm">Loading DocFix CRDT Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen transition-colors ${isDark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Top Header Bar (Hidden in Zen mode) */}
      {!isZenMode && (
        <div className={`flex items-center justify-between px-4 py-2.5 border-b transition-colors ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5"
              title="Back to Dashboard"
            >
              <span>📄</span>
              <span className="hidden sm:inline font-extrabold tracking-tight">DocFix</span>
            </a>

            <div className={`h-5 w-px mx-1 hidden sm:block ${isDark ? "bg-gray-700" : "bg-gray-300"}`} />

            {/* Editable Document Title */}
            <input
              type="text"
              value={title}
              disabled={isReadOnly}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Document"
              className={`text-sm sm:text-base font-semibold px-2.5 py-1 rounded transition-colors max-w-[160px] sm:max-w-xs md:max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-transparent text-gray-100 hover:bg-gray-800"
                  : "bg-transparent text-gray-800 hover:bg-gray-100"
              }`}
              title={isReadOnly ? "Read-Only Document" : "Click to rename document"}
            />

            {/* Role Badge */}
            {isReadOnly ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                <Lock size={11} /> Viewer
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full hidden md:inline">
                Editor
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Chaos / Network Simulation Dropdown */}
            <div className="flex items-center gap-1 text-xs">
              <select
                value={networkCondition}
                onChange={(e) => handleNetworkChange(e.target.value as "normal" | "lag" | "offline")}
                className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors cursor-pointer focus:outline-none ${
                  networkCondition === "offline"
                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                    : networkCondition === "lag"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : isDark
                        ? "bg-gray-800 text-gray-300 border-gray-700"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
                title="Simulate network conditions for judging"
              >
                <option value="normal">⚡ Online (Normal)</option>
                <option value="lag">🐢 Latency (500ms lag)</option>
                <option value="offline">🔌 Offline (Partition)</option>
              </select>
            </div>

            {/* Active Collaborators */}
            <OnlineUsers
              editor={editor}
              onFollowUser={handleFollowUser}
              followingUser={followingUser}
            />
          </div>
        </div>
      )}

      {/* Formatting Toolbar */}
      <Toolbar
        editor={editor}
        isDark={isDark}
        onToggleDark={toggleTheme}
        isReadOnly={isReadOnly}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode(!isZenMode)}
        documentTitle={title}
      />

      {/* Main Canvas Area */}
      <div className={`flex-1 overflow-y-auto ${isDark ? "bg-gray-950" : "bg-gray-100/70"}`}>
        <div
          className={`max-w-4xl mx-auto my-6 rounded-xl shadow-xs border transition-all min-h-[750px] ${
            isDark
              ? "bg-gray-900 border-gray-800 text-gray-100"
              : "bg-white border-gray-200 text-gray-900"
          }`}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Bottom Status & Telemetry Bar */}
      <footer
        className={`flex items-center justify-between px-4 py-1.5 border-t text-xs select-none transition-colors ${
          isDark
            ? "bg-gray-900 border-gray-800 text-gray-400"
            : "bg-white border-gray-200 text-gray-500"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <div
              className={`w-2 h-2 rounded-full ${
                status === "connected"
                  ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                  : status === "connecting"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-rose-500"
              }`}
            />
            <span className="capitalize">
              {status === "connected" ? (synced ? "Synced · Real-time" : "Syncing...") : status}
            </span>
          </div>

          <div className="h-3 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block" />

          {/* Word / Char Stats */}
          <div className="flex items-center gap-3 text-[11px] hidden sm:flex">
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{charCount} chars</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {Math.ceil(wordCount / 200) || 1} min read
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="font-semibold text-blue-500 hidden md:inline">Yjs YATA CRDT</span>
          <span>·</span>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("docfix-active-user");
              localStorage.removeItem("docfix-username");
              localStorage.removeItem("docfix-userrole");
              window.location.reload();
            }}
            className="hover:underline text-blue-500 cursor-pointer"
            title="Click to switch profile / user"
          >
            User: <strong>{userName}</strong> (Switch)
          </button>
        </div>
      </footer>

      {/* Live CRDT & Distributed Systems Diagnostics HUD */}
      <DiagnosticsHUD
        ydoc={ydoc}
        provider={wsProvider}
        documentId={documentId}
        isDark={isDark}
      />
    </div>
  );
}
