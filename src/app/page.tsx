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

// Pre-configured profiles with soothing pastel colors
const PROFILES = [
  {
    name: "Alice",
    role: "Lead Architect",
    color: "#E07A5F", // Pastel Terracotta
    type: "editor" as const,
    badge: "Editor",
  },
  {
    name: "Bob",
    role: "Product Designer",
    color: "#84A98C", // Pastel Sage
    type: "editor" as const,
    badge: "Editor",
  },
  {
    name: "Charlie",
    role: "Security Auditor",
    color: "#D4A373", // Pastel Honey Amber
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
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-orange-500">
        <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // =========================================================================
  // SCREEN 1: LOGIN / SELECT WHO IS WORKING (PASTEL WARM THEME)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#FFF6EB] to-[#FDE8D0] flex flex-col items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-orange-950/5 p-8 sm:p-10 max-w-lg w-full border border-orange-100/80">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white text-3xl mb-4 shadow-lg shadow-orange-500/20">
              📄
            </div>
            <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">
              Welcome to DocFix
            </h1>
            <p className="text-stone-500 text-sm mt-1.5">
              Select who is working to start your collaborative session
            </p>
          </div>

          {/* Quick User Profiles */}
          <div className="space-y-3 mb-6">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider">
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
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-stone-200/80 bg-stone-50/40 hover:border-orange-300 hover:bg-orange-50/50 transition-all text-left group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 text-sm group-hover:text-orange-600 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {p.role}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    p.type === "viewer"
                      ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                      : "bg-orange-50 text-orange-800 border border-orange-200/60"
                  }`}
                >
                  {p.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-stone-200" />
            <span className="flex-shrink mx-4 text-xs text-stone-400 font-medium">
              or enter custom name
            </span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          {/* Custom Name Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = customNameInput.trim() || "Guest User";
              handleLogin({
                name,
                role: "Custom Editor",
                color: "#F4A261", // Pastel Apricot
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
              className="flex-1 px-4 py-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-sm text-stone-800 placeholder-stone-400"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer shadow-sm shadow-orange-500/20"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: DASHBOARD (PASTEL WARM THEME)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 flex flex-col justify-between">
      <div>
        {/* Top Navbar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-20 shadow-xs">
          <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📄</span>
              <h1 className="text-2xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent tracking-tight">
                DocFix
              </h1>
            </div>

            {/* Current User Info & Switch Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-stone-100/90 rounded-full border border-stone-200/80">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.name[0]}
                </div>
                <div className="text-xs font-semibold text-stone-700">
                  {currentUser.name}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-stone-400 hover:text-orange-600 ml-1 cursor-pointer flex items-center gap-1 font-medium transition-colors"
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
          {/* Hero Banner with Soft Pastel Gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF7ED] via-[#FFEDD5] to-[#FED7AA]/80 border border-orange-200/80 rounded-3xl p-8 sm:p-10 mb-8 text-stone-800 shadow-sm">
            {/* Subtle background ambient highlight */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between flex-wrap gap-4 mb-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 border border-orange-200/90 text-orange-950 text-xs font-semibold backdrop-blur-sm shadow-xs">
                <ShieldCheck size={14} className="text-orange-600" />
                <span>CRDT Workspace Active · Logged in as {currentUser.name}</span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-stone-900 relative z-10">
              Create & Collaborate in Real Time
            </h2>
            <p className="text-stone-600 mb-8 max-w-2xl text-sm sm:text-base leading-relaxed relative z-10 font-normal">
              Every document is powered by Yjs YATA CRDT. Multiple users can edit simultaneously
              with sub-millisecond sync, live presence carets, and zero race conditions.
            </p>

            {/* "+ New Document" Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="relative z-10 flex items-center gap-2.5 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer text-base hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={20} />
              <span>New Document</span>
            </button>
          </div>

          {/* Join by URL / ID Box */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 mb-8 shadow-xs">
            <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
              Join Shared Document
            </h3>
            <form onSubmit={handleJoinDocument} className="flex gap-3">
              <input
                type="text"
                value={joinUrlInput}
                onChange={(e) => setJoinUrlInput(e.target.value)}
                placeholder="Paste document ID or full URL link..."
                className="flex-1 px-4 py-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-sm text-stone-800 placeholder-stone-400"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer shadow-xs"
              >
                <ArrowRight size={16} />
                <span>Join</span>
              </button>
            </form>
          </div>

          {/* Recent Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-800">Your Documents</h3>
              <span className="text-xs text-stone-500 font-medium">
                {documents.length} {documents.length === 1 ? "document" : "documents"}
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center shadow-xs">
                <FileText size={44} className="mx-auto text-stone-300 mb-3" />
                <p className="text-stone-700 font-semibold mb-1">
                  No documents created yet
                </p>
                <p className="text-stone-400 text-xs mb-4">
                  Click &quot;New Document&quot; above to create and name your first document.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200/60 hover:bg-orange-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus size={15} /> Create Document
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-stone-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-300 hover:shadow-md transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(doc.id)}
                      className="flex items-center gap-3.5 flex-1 text-left cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-xl bg-orange-50/80 border border-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-xs">
                        📄
                      </div>
                      <div>
                        <p className="font-bold text-stone-800 group-hover:text-orange-600 transition-colors text-base">
                          {doc.title}
                        </p>
                        <p className="text-xs text-stone-400">
                          Opened {formatDate(doc.lastOpened)} · ID: {doc.id.slice(0, 8)}...
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(doc.id, "editor")}
                        className="text-xs px-2.5 py-1.5 text-stone-600 hover:text-orange-700 hover:bg-orange-50/80 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Share2 size={13} />
                        <span>{copiedId === `${doc.id}-editor` ? "Copied!" : "Share Link"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-7 max-w-md w-full border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-800">
                Create New Document
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Sprint Planning Notes, Architecture Spec..."
                  className="w-full px-4 py-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-sm text-stone-800 font-medium placeholder-stone-400"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-stone-600 hover:bg-stone-100 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-stone-400 border-t border-stone-200/80 w-full mt-10">
        <p>DocFix Collaborative Engine · Built with Yjs (CRDT) · TipTap v3 · Next.js · WebSockets</p>
      </footer>
    </div>
  );
}