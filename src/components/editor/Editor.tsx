"use client";
"use no memo";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
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
import FindReplaceBar from "./FindReplaceBar";
import PagesSidebar from "./PagesSidebar";
import ShortcutsModal from "../ui/ShortcutsModal";
import ShortcutsPill from "../ui/ShortcutsPill";
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
  const [isPaginated, setIsPaginated] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPagesPanelOpen, setIsPagesPanelOpen] = useState(false);

  // Dynamic Page & Section Tracking
  const [currentViewPage, setCurrentViewPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeHeading, setActiveHeading] = useState("");
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Initialize theme & viewMode
  useEffect(() => {
    const savedTheme = localStorage.getItem("docfix-theme");
    if (savedTheme === "dark") {
      setIsDark(true);
    }
    const savedViewMode = localStorage.getItem("docfix-viewmode");
    if (savedViewMode === "paginated") {
      setIsPaginated(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("docfix-theme", next ? "dark" : "light");
  };

  const toggleViewMode = () => {
    const next = !isPaginated;
    setIsPaginated(next);
    localStorage.setItem("docfix-viewmode", next ? "paginated" : "pageless");
  };

  // Dynamic scroll observer to detect which page & heading is active
  const handleCanvasScroll = useCallback(() => {
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const containerTop = container.getBoundingClientRect().top;
    const allHrs = container.querySelectorAll(".tiptap hr");

    let pageNum = 1;
    allHrs.forEach((hr, idx) => {
      const hrTop = hr.getBoundingClientRect().top - containerTop;
      if (hrTop <= 250) {
        pageNum = idx + 2;
      }
    });

    setCurrentViewPage(pageNum);
    setTotalPages(Math.max(1, allHrs.length + 1));

    // Detect nearest heading above current viewport
    const allHeadings = container.querySelectorAll(".tiptap h1, .tiptap h2, .tiptap h3");
    let currentH = "";
    allHeadings.forEach((h) => {
      const hTop = h.getBoundingClientRect().top - containerTop;
      if (hTop <= 250) {
        currentH = h.textContent || "";
      }
    });
    if (currentH.length > 25) {
      currentH = currentH.substring(0, 25) + "...";
    }
    setActiveHeading(currentH);
  }, []);

  // Helper to update document title in localStorage
  const updateLocalStorageTitle = useCallback((newTitle: string) => {
    try {
      const saved = localStorage.getItem("synora-documents");
      if (saved) {
        const docs = JSON.parse(saved);
        const idx = docs.findIndex((d: { id: string }) => d.id === documentId);
        if (idx !== -1) {
          docs[idx].title = newTitle || "Untitled Document";
          docs[idx].lastOpened = new Date().toISOString();
          localStorage.setItem("synora-documents", JSON.stringify(docs));
        }
      }
    } catch {}
  }, [documentId]);

  // Sync title from Yjs & LocalStorage
  useEffect(() => {
    const updateTitle = () => {
      const remoteTitle = yMeta.get("title");
      if (typeof remoteTitle === "string") {
        setTitle(remoteTitle);
      } else {
        // Initial load when yMeta doesn't have a title yet
        let initialTitle = "Untitled Document";
        try {
          const saved = localStorage.getItem("synora-documents");
          if (saved) {
            const docs = JSON.parse(saved);
            const found = docs.find((d: { id: string; title: string }) => d.id === documentId);
            if (found && found.title) {
              initialTitle = found.title;
            }
          }
        } catch {}

        if (!isReadOnly) {
          yMeta.set("title", initialTitle);
        }
        setTitle(initialTitle);
      }
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
    updateLocalStorageTitle(newTitle);
  };

  const handleTitleBlur = () => {
    if (isReadOnly) return;
    if (!title.trim()) {
      const defaultTitle = "Untitled Document";
      setTitle(defaultTitle);
      yMeta.set("title", defaultTitle);
      updateLocalStorageTitle(defaultTitle);
    }
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

  // TipTap v3 Editor initialization with Table, TaskList, Color, and Highlight extensions
  const editor = useEditor({
    editable: !isReadOnly,
    extensions: [
      StarterKit.configure({
        undoRedo: false, // Collaborative history handled by Yjs
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
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

  // Shortcut for DocPilot (Cmd+J / Ctrl+J), Manual Save (Cmd+S / Ctrl+S), and Find (Cmd+F / Ctrl+F)
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault(); // Prevent browser default find bar
        setIsFindReplaceOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
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
      <div className="flex items-center justify-center h-screen bg-[#FAF7F2] text-stone-600">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-sm">Initializing TipTap Surface...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen transition-colors ${isDark ? "bg-[#161412] text-stone-100" : "bg-[#FAF7F2] text-stone-800"}`}>
      {/* Top Header Bar */}
      {!isZenMode && (
        <div className={`flex items-center justify-between px-4 py-2 border-b transition-colors ${isDark ? "bg-[#1E1B18] border-stone-800/80" : "bg-white/95 border-stone-200/80"}`}>
          <div className="flex items-center gap-2.5">
            <a
              href="/"
              className="text-lg font-bold transition-colors flex items-center gap-1.5 group"
              title="Back to Dashboard"
            >
              <span className="group-hover:scale-110 transition-transform">📄</span>
              <span className="hidden sm:inline font-black tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">DocFix</span>
            </a>

            <div className={`h-4 w-px mx-0.5 hidden sm:block ${isDark ? "bg-stone-800" : "bg-stone-200"}`} />

            {/* Editable Title */}
            <input
              type="text"
              value={title}
              disabled={isReadOnly}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Untitled Document"
              className={`text-sm sm:text-base font-semibold px-2 py-0.5 rounded-md transition-all max-w-[160px] sm:max-w-xs md:max-w-md focus:outline-none focus:ring-1 focus:ring-orange-400/50 ${
                isDark
                  ? "bg-transparent text-stone-100 hover:bg-stone-800/60 focus:bg-stone-800"
                  : "bg-transparent text-stone-800 hover:bg-stone-100/80 focus:bg-stone-50"
              }`}
              title={isReadOnly ? "Read-Only Document" : "Click to rename document"}
            />

            {/* Role Badge */}
            {isReadOnly ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full">
                <Lock size={11} /> Viewer
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-orange-50 text-orange-800 border border-orange-200/60 rounded-full hidden md:inline">
                Editor
              </span>
            )}

            {/* Dynamic Active Section & Page Breadcrumb */}
            {activeHeading && (
              <div className="hidden xl:flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium animate-in fade-in duration-150">
                <span className="text-stone-300 dark:text-stone-700">›</span>
                <span className="truncate max-w-[140px] text-stone-700 dark:text-stone-300 font-semibold">
                  {activeHeading}
                </span>
                <span className="px-1.5 py-0.2 bg-orange-50 text-orange-700 border border-orange-200/60 rounded text-[10px] font-bold">
                  Page {currentViewPage}/{totalPages}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Share / Invite Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-orange-500/20 active:scale-95 cursor-pointer"
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
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all cursor-pointer focus:outline-none ${
                  networkCondition === "offline"
                    ? "bg-red-500/10 text-red-500 border-red-500/30 font-semibold"
                    : networkCondition === "lag"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold"
                      : isDark
                        ? "bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-800"
                        : "bg-stone-100/90 text-stone-700 border-stone-200 hover:bg-stone-100"
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
        isPaginated={isPaginated}
        onTogglePaginated={toggleViewMode}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        isPagesOpen={isPagesPanelOpen}
        onTogglePages={() => setIsPagesPanelOpen(!isPagesPanelOpen)}
      />

      {/* Floating Find & Replace Bar */}
      <FindReplaceBar
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        editor={editor}
        isDark={isDark}
      />

      {/* Main Workspace Area (Left Pages Rail + Scrollable Canvas) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PowerPoint-style Left Pages Rail */}
        {!isZenMode && (
          <PagesSidebar
            editor={editor}
            isOpen={isPagesPanelOpen}
            onClose={() => setIsPagesPanelOpen(false)}
            isDark={isDark}
            documentTitle={title}
          />
        )}

        {/* Main Canvas Area with dynamic scroll tracking */}
        <div
          ref={canvasContainerRef}
          onScroll={handleCanvasScroll}
          className={`flex-1 overflow-y-auto cursor-text ${isDark ? "bg-[#141210]" : "bg-[#FAF7F2]"}`}
          onClick={() => {
            if (!editor.isFocused) {
              editor.commands.focus("end");
            }
          }}
        >
          <div
            className={`transition-all ${
              isPaginated
                ? `paper-paginated mx-auto my-8 border ${
                    isDark
                      ? "bg-stone-900 border-stone-800 text-stone-100 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                      : "bg-white border-stone-200 text-stone-900 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
                  }`
                : `max-w-4xl mx-auto my-8 rounded-2xl border ${
                    isDark
                      ? "bg-stone-900 border-stone-800/80 text-stone-100 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
                      : "bg-white border-stone-200/80 text-stone-900 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_rgba(0,0,0,0.03)]"
                  }`
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (!editor.isFocused) {
                editor.commands.focus();
              }
            }}
          >
            {/* Dynamic Paginated Header Indicator */}
            {isPaginated && (
              <div
                className={`px-16 pt-6 pb-2 text-[10px] uppercase font-semibold tracking-wider flex justify-between border-b select-none transition-colors ${
                  isDark ? "text-stone-500 border-stone-800" : "text-stone-400 border-stone-100"
                }`}
              >
                <span>DocFix · {title} {activeHeading ? `› ${activeHeading}` : ""}</span>
                <span className="text-orange-600 dark:text-orange-400 font-bold">A4 Page {currentViewPage} of {totalPages}</span>
              </div>
            )}

            <EditorContent editor={editor} />
          </div>
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

      {/* Floating Hideable Keyboard Shortcuts Pill (Bottom Right) */}
      {!isZenMode && (
        <ShortcutsPill
          onOpen={() => setIsShortcutsOpen(true)}
          isDark={isDark}
        />
      )}

      {/* Keyboard Shortcuts Manual Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
