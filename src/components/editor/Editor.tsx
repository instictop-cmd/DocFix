"use client";
"use no memo";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import Underline from "@tiptap/extension-underline";
import TipTapImage from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { useEffect, useState, useCallback, useRef } from "react";
import Toolbar from "./Toolbar";
import OnlineUsers from "../presence/OnlineUsers";
import ShareModal from "./ShareModal";
import TeamChat from "../chat/TeamChat";
import VersionHistoryModal from "../history/VersionHistoryModal";
import DocPilotModal from "../ai/DocPilotModal";
import PollModal from "../polls/PollModal";
import SaveToast from "../ui/SaveToast";
import { createSnapshot } from "../../lib/snapshotUtils";
import {
  Save,
  FileText,
  Clock,
  Wifi,
  WifiOff,
  Radio,
  Eye,
  CheckCircle2,
  Lock,
  Share2,
  MessageSquare,
  History,
  Sparkles,
  Vote,
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
  const [collab, setCollab] = useState<{
    ydoc: Y.Doc;
    wsProvider: WebsocketProvider;
    userColor: string;
  } | null>(null);

  // Robust lifecycle for React 18/19 StrictMode & Fast Refresh
  useEffect(() => {
    const doc = new Y.Doc();
    const color = getRandomColor();

    // Determine WebSocket server URL (local or cloud)
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? "wss://demos.yjs.dev/ws"
        : "ws://localhost:1234");

    // Connect to WebSocket server
    const provider = new WebsocketProvider(
      wsUrl,
      documentId,
      doc
    );

    // IndexedDB offline persistence
    const idb = new IndexeddbPersistence(documentId, doc);

    // Broadcast initial awareness username & color
    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: color,
    });

    setCollab({
      ydoc: doc,
      wsProvider: provider,
      userColor: color,
    });

    return () => {
      provider.destroy();
      idb.destroy();
      doc.destroy();
      setCollab(null);
    };
  }, [documentId, userName]);

  if (!collab) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-sm">Connecting to DocFix CRDT Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <EditorSurface
      documentId={documentId}
      userName={userName}
      userRole={userRole}
      ydoc={collab.ydoc}
      wsProvider={collab.wsProvider}
      userColor={collab.userColor}
    />
  );
}

interface EditorSurfaceProps {
  documentId: string;
  userName: string;
  userRole: "editor" | "viewer";
  ydoc: Y.Doc;
  wsProvider: WebsocketProvider;
  userColor: string;
}

function EditorSurface({
  documentId,
  userName,
  userRole,
  ydoc,
  wsProvider,
  userColor,
}: EditorSurfaceProps) {
  const isReadOnly = userRole === "viewer";
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [synced, setSynced] = useState(false);
  const [title, setTitle] = useState("Untitled Document");
  const [isDark, setIsDark] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [followingUser, setFollowingUser] = useState<string | null>(null);
  const [networkCondition, setNetworkCondition] = useState<"normal" | "lag" | "offline">("normal");
  
  // Modals & Drawers
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDocPilotOpen, setIsDocPilotOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);

  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Autosave & Cmd+S state
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"auto" | "manual">("auto");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_SAVE_DELAY = 5 * 60 * 1000; // 5 minutes

  const yMeta = useRef(ydoc.getMap("meta")).current;

  // Initialize theme
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

  // Sync title
  useEffect(() => {
    const updateTitle = () => {
      let remoteTitle = (yMeta.get("title") as string) || "";
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
        } catch {}
      }

      const finalTitle = remoteTitle || "Untitled Document";
      setTitle(finalTitle);
    };

    yMeta.observe(updateTitle);
    updateTitle();

    return () => {
      yMeta.unobserve(updateTitle);
    };
  }, [yMeta, documentId, isReadOnly]);

  const handleTitleChange = (newTitle: string) => {
    if (isReadOnly) return;
    setTitle(newTitle);
    yMeta.set("title", newTitle);
  };

  // Connection status tracking
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

  // TipTap v3 Editor initialization with Table & TaskList extensions
  const editor = useEditor({
    editable: !isReadOnly,
    extensions: [
      StarterKit.configure({
        undoRedo: false, // Collaborative history handled by Yjs
      }),
      Underline,
      TipTapImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
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
  });

  // Helper: show save toast notification
  const showSaveToast = useCallback((message: string, type: "auto" | "manual") => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
    setLastSavedAt(Date.now());
  }, []);

  // Helper: perform a manual save (Cmd+S)
  const handleManualSave = useCallback(() => {
    if (!editor) return;

    // Debounce: ignore if last save was < 10 seconds ago
    if (lastSaveDebounceRef.current) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const snapshot = createSnapshot(ydoc, editor, userName, `📌 Manual save · ${time}`);

    if (snapshot) {
      showSaveToast(`Checkpoint saved · ${time}`, "manual");
    } else {
      // Even if no changes, acknowledge the Cmd+S
      showSaveToast("Already up to date", "manual");
    }

    // 10-second debounce to prevent spamming
    lastSaveDebounceRef.current = setTimeout(() => {
      lastSaveDebounceRef.current = null;
    }, 10000);
  }, [editor, ydoc, userName, showSaveToast]);

  // Shortcut for DocPilot (Cmd+J / Ctrl+J) and Manual Save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsDocPilotOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); // Prevent browser "Save Page" dialog
        handleManualSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleManualSave]);

  // Autosave: create snapshot after 5 minutes of inactivity
  useEffect(() => {
    if (!editor || isReadOnly) return;

    const resetAutoSaveTimer = () => {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new 5-minute timer
      autoSaveTimerRef.current = setTimeout(() => {
        if (!editor) return;
        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const snapshot = createSnapshot(ydoc, editor, userName, `🔄 Auto-save · ${time}`);

        if (snapshot) {
          showSaveToast(`Auto-saved · ${time}`, "auto");
        }
      }, AUTO_SAVE_DELAY);
    };

    // Listen to editor updates (every keystroke resets the timer)
    editor.on("update", resetAutoSaveTimer);

    // Start the initial timer
    resetAutoSaveTimer();

    return () => {
      editor.off("update", resetAutoSaveTimer);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [editor, isReadOnly, ydoc, userName, showSaveToast, AUTO_SAVE_DELAY]);

  useEffect(() => {
    if (!editor || isReadOnly) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
              const src = uploadEvent.target?.result as string;
              if (src) {
                editor.chain().focus().setImage({ src }).run();
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    const handleDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith("image/")) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const src = uploadEvent.target?.result as string;
            if (src) {
              editor.chain().focus().setImage({ src }).run();
            }
          };
          reader.readAsDataURL(files[i]);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("drop", handleDrop);
    };
  }, [editor, isReadOnly]);

  // Follow User Mode
  const handleFollowUser = useCallback(
    (targetName: string) => {
      if (followingUser === targetName) {
        setFollowingUser(null);
        return;
      }
      setFollowingUser(targetName);

      const labels = document.querySelectorAll(".collaboration-carets__label, .collaboration-cursor__label");
      labels.forEach((label) => {
        if (label.textContent?.includes(targetName)) {
          label.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    },
    [followingUser]
  );

  // Network Chaos & Latency Simulator (Real 500ms Injected Latency)
  useEffect(() => {
    const ws = wsProvider.ws;
    if (!ws) return;

    if (networkCondition === "lag") {
      const originalSend = ws.send;
      ws.send = function (data: any) {
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            originalSend.call(ws, data);
          }
        }, 500);
      };

      return () => {
        ws.send = originalSend;
      };
    }
  }, [networkCondition, wsProvider, wsProvider.ws]);

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
      <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-sm">Initializing TipTap Surface...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen transition-colors ${isDark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Top Header Bar */}
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

            {/* Editable Title */}
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

          <div className="flex items-center gap-2 sm:gap-3">

            {/* Share / Invite Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Share document via Gmail, email, or link"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Invite / Share</span>
            </button>

            {/* Chaos / Network Simulation Dropdown */}
            <div className="flex items-center gap-1 text-xs">
              <select
                value={networkCondition}
                onChange={(e) => handleNetworkChange(e.target.value as "normal" | "lag" | "offline")}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer focus:outline-none ${
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
                <option value="normal">⚡ Stable</option>
                <option value="lag">🐢 Slow Network</option>
                <option value="offline">✈️ Airplane Mode</option>
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
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        onOpenDocPilot={() => setIsDocPilotOpen(true)}
        onOpenPolls={() => setIsPollModalOpen(true)}
      />

      {/* Main Canvas Area */}
      <div
        className={`flex-1 overflow-y-auto cursor-text ${isDark ? "bg-gray-950" : "bg-gray-100/70"}`}
        onClick={() => {
          if (!editor.isFocused) {
            editor.commands.focus("end");
          }
        }}
      >
        <div
          className={`max-w-4xl mx-auto my-6 rounded-xl shadow-xs border transition-all min-h-[750px] ${
            isDark
              ? "bg-gray-900 border-gray-800 text-gray-100"
              : "bg-white border-gray-200 text-gray-900"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!editor.isFocused) {
              editor.commands.focus();
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Bottom Status Bar (Real-Time Stats Only) */}
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
          {lastSavedAt && (
            <div className="flex items-center gap-1 text-[11px] font-medium opacity-70">
              <Save size={10} />
              <span>
                Saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>

        {/* Real-time word & char count */}
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{charCount} characters</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {Math.ceil(wordCount / 200) || 1} min read
          </span>
        </div>
      </footer>

      {/* Save Toast Notification */}
      <SaveToast
        message={toastMessage}
        type={toastType}
        isVisible={isToastVisible}
        onDismiss={() => setIsToastVisible(false)}
      />

      {/* DocPilot AI Copilot Modal */}
      <DocPilotModal
        isOpen={isDocPilotOpen}
        onClose={() => setIsDocPilotOpen(false)}
        editor={editor}
        isDark={isDark}
      />

      {/* Collaborative Live Polls Modal */}
      <PollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        ydoc={ydoc}
        editor={editor}
        currentUserName={userName}
        isDark={isDark}
      />

      {/* Google Docs-Style Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        documentId={documentId}
        documentTitle={title}
        isDark={isDark}
      />

      {/* Live In-Doc Team Chat Drawer */}
      <TeamChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        ydoc={ydoc}
        currentUserName={userName}
        currentUserColor={userColor}
        isDark={isDark}
      />

      {/* Document Version History & Snapshot Rollback */}
      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        ydoc={ydoc}
        editor={editor}
        currentUserName={userName}
        isDark={isDark}
      />
    </div>
  );
}
