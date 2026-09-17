"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  FileText,
  Trash2,
  Share2,
  Lock,
  ArrowRight,
  LogOut,
  User,
  ShieldCheck,
  Cpu,
  Wifi,
  Users,
  Sparkles,
  X,
} from "lucide-react";

// Pre-configured profiles for hackathon judging & quick testing
const PROFILES = [
  {
    name: "Alice",
    role: "Lead Architect",
    color: "#2563EB",
    type: "editor" as const,
    badge: "Editor",
  },
  {
    name: "Bob",
    role: "Product Designer",
    color: "#059669",
    type: "editor" as const,
    badge: "Editor",
  },
  {
    name: "Charlie",
    role: "Security Auditor",
    color: "#D97706",
    type: "viewer" as const,
    badge: "Viewer (Read-Only)",
  },
];

interface UserProfile {
  name: string;
  role: string;
  color: string;
  type: "editor" | "viewer";
}

interface SavedDocument {
  id: string;
  title: string;
  createdAt: string;
  lastOpened: string;
}

export default function Home() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [customNameInput, setCustomNameInput] = useState("");

  // Dashboard & Document State
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [joinUrlInput, setJoinUrlInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Check if user is logged in on mount
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem("docfix-active-user");
      if (savedUserStr) {
        setCurrentUser(JSON.parse(savedUserStr));
      }

      const savedDocsStr = localStorage.getItem("synora-documents");
      if (savedDocsStr) {
        setDocuments(JSON.parse(savedDocsStr));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Save documents to state and localStorage
  const saveDocs = (docs: SavedDocument[]) => {
    setDocuments(docs);
    localStorage.setItem("synora-documents", JSON.stringify(docs));
  };

  // Login handler
  const handleLogin = (profile: UserProfile) => {
    setCurrentUser(profile);
    localStorage.setItem("docfix-active-user", JSON.stringify(profile));
    localStorage.setItem("docfix-username", profile.name);
    localStorage.setItem("docfix-userrole", profile.type);
  };

  // Logout / Switch User handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("docfix-active-user");
    localStorage.removeItem("docfix-username");
    localStorage.removeItem("docfix-userrole");
  };

  // Create named document
  const handleCreateDocument = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newDocName.trim() || "Untitled Document";
    const id = uuidv4();

    const newDoc: SavedDocument = {
      id,
      title,
      createdAt: new Date().toISOString(),
      lastOpened: new Date().toISOString(),
    };

    saveDocs([newDoc, ...documents]);
    setIsCreateModalOpen(false);
    setNewDocName("");
    router.push(`/document/${id}`);
  };

  // Open existing document
  const handleOpenDocument = (id: string) => {
    const updated = documents.map((doc) =>
      doc.id === id ? { ...doc, lastOpened: new Date().toISOString() } : doc
    );
    saveDocs(updated);
    router.push(`/document/${id}`);
  };

  // Delete document
  const handleDeleteDocument = (id: string) => {
    saveDocs(documents.filter((d) => d.id !== id));
  };

  // Join by URL or ID
  const handleJoinDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const input = joinUrlInput.trim();
    if (!input) return;

    const match = input.match(/\/document\/([^?]+)/);
    const docId = match ? match[1] : input;

    if (!documents.find((d) => d.id === docId)) {
      const newDoc: SavedDocument = {
        id: docId,
        title: "Shared Document",
        createdAt: new Date().toISOString(),
        lastOpened: new Date().toISOString(),
      };
      saveDocs([newDoc, ...documents]);
    }

    router.push(`/document/${docId}`);
  };

  // Copy share link
  const handleCopyLink = (id: string, role: "editor" | "viewer" = "editor") => {
    const url = `${window.location.origin}/document/${id}${role === "viewer" ? "?role=viewer" : ""}`;
    navigator.clipboard.writeText(url);
    setCopiedId(`${id}-${role}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleDateString();
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-blue-400">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // =========================================================================
  // SCREEN 1: LOGIN / SELECT WHO IS WORKING
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 sm:p-10 max-w-lg w-full border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-3xl mb-4 shadow-xl shadow-blue-500/25">
              📄
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome to DocFix
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
              Select who is working to start your collaborative session
            </p>
          </div>

          {/* Quick User Profiles */}
          <div className="space-y-3 mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Working Profile
            </label>
            {PROFILES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() =>
                  handleLogin({
                    name: p.name,
                    role: p.role,
                    color: p.color,
                    type: p.type,
                  })
                }
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 transition-all text-left group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {p.role}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    p.type === "viewer"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                  }`}
                >
                  {p.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-4 text-xs text-slate-400 font-medium">
              or enter custom name
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Custom Name Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = customNameInput.trim() || "Guest User";
              handleLogin({
                name,
                role: "Custom Editor",
                color: "#7C3AED",
                type: "editor",
              });
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={customNameInput}
              onChange={(e) => setCustomNameInput(e.target.value)}
              placeholder="Your name..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: DASHBOARD (AFTER LOGGING IN)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
          <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📄</span>
              <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">
                DocFix
              </h1>
            </div>

            {/* Current User Info & Switch Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.name[0]}
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  {currentUser.name}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-red-600 ml-1 cursor-pointer flex items-center gap-1 font-medium"
                  title="Switch user"
                >
                  <LogOut size={12} />
                  <span>Switch</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 rounded-3xl p-8 sm:p-10 mb-8 text-white shadow-xl shadow-blue-500/10">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold backdrop-blur-sm border border-white/10">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>CRDT Workspace Active · Logged in as {currentUser.name}</span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Create & Collaborate in Real Time
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl text-sm sm:text-base leading-relaxed">
              Every document is powered by Yjs YATA CRDT. Multiple users can edit simultaneously
              with sub-millisecond sync, live presence carets, and zero race conditions.
            </p>

            {/* "+ New Document" Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg shadow-black/10 cursor-pointer text-base hover:scale-102"
            >
              <Plus size={20} />
              <span>New Document</span>
            </button>
          </div>

          {/* Join by URL / ID Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Join Shared Document
            </h3>
            <form onSubmit={handleJoinDocument} className="flex gap-3">
              <input
                type="text"
                value={joinUrlInput}
                onChange={(e) => setJoinUrlInput(e.target.value)}
                placeholder="Paste document ID or full URL link..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                <ArrowRight size={16} />
                <span>Join</span>
              </button>
            </form>
          </div>

          {/* Recent Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Your Documents</h3>
              <span className="text-xs text-slate-500">
                {documents.length} {documents.length === 1 ? "document" : "documents"}
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <FileText size={44} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-700 font-semibold mb-1">
                  No documents created yet
                </p>
                <p className="text-slate-400 text-xs mb-4">
                  Click &quot;New Document&quot; above to create and name your first document.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus size={15} /> Create Document
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(doc.id)}
                      className="flex items-center gap-3.5 flex-1 text-left cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                        📄
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base">
                          {doc.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          Opened {formatDate(doc.lastOpened)} · ID: {doc.id.slice(0, 8)}...
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(doc.id, "editor")}
                        className="text-xs px-2.5 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Share2 size={13} />
                        <span>{copiedId === `${doc.id}-editor` ? "Copied!" : "Share Link"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ===================================================================== */}
      {/* MODAL: NAME YOUR NEW DOCUMENT */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-7 max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Create New Document
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Sprint Planning Notes, Architecture Spec..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 font-medium"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-400 border-t border-slate-200 w-full mt-10">
        <p>DocFix Collaborative Engine · Built with Yjs (CRDT) · TipTap v3 · Next.js · WebSockets</p>
      </footer>
    </div>
  );
}