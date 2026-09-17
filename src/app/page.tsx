"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  FileText,
  ArrowRight,
  Trash2,
  Users,
  Wifi,
  Share2,
  ShieldCheck,
  Cpu,
  Lock,
  ExternalLink,
  Copy,
} from "lucide-react";

interface SavedDocument {
  id: string;
  title: string;
  createdAt: string;
  lastOpened: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [joinId, setJoinId] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load saved documents from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("synora-documents");
    if (saved) {
      try {
        setDocuments(JSON.parse(saved));
      } catch {
        setDocuments([]);
      }
    }
  }, []);

  const saveDocuments = (docs: SavedDocument[]) => {
    setDocuments(docs);
    localStorage.setItem("synora-documents", JSON.stringify(docs));
  };

  const createNewDocument = () => {
    const id = uuidv4();
    const docTitle = newDocTitle.trim() || "Untitled Document";
    const newDoc: SavedDocument = {
      id,
      title: docTitle,
      createdAt: new Date().toISOString(),
      lastOpened: new Date().toISOString(),
    };
    saveDocuments([newDoc, ...documents]);
    setNewDocTitle("");
    router.push(`/document/${id}`);
  };

  const openDocument = (id: string) => {
    const updated = documents.map((doc) =>
      doc.id === id ? { ...doc, lastOpened: new Date().toISOString() } : doc
    );
    saveDocuments(updated);
    router.push(`/document/${id}`);
  };

  const deleteDocument = (id: string) => {
    saveDocuments(documents.filter((doc) => doc.id !== id));
  };

  const joinDocument = () => {
    const id = joinId.trim();
    if (!id) return;

    const match = id.match(/\/document\/([^?]+)/);
    const docId = match ? match[1] : id;

    if (!documents.find((d) => d.id === docId)) {
      const newDoc: SavedDocument = {
        id: docId,
        title: "Shared Document",
        createdAt: new Date().toISOString(),
        lastOpened: new Date().toISOString(),
      };
      saveDocuments([newDoc, ...documents]);
    }

    router.push(`/document/${docId}`);
  };

  const copyShareLink = (id: string, role: "editor" | "viewer" = "editor") => {
    const url = `${window.location.origin}/document/${id}${role === "viewer" ? "?role=viewer" : ""}`;
    navigator.clipboard.writeText(url);
    setCopiedId(`${id}-${role}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Header */}
      <div>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
          <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📄</span>
              <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">DocFix</h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>CRDT Sync Online</span>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Hero section */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 rounded-3xl p-8 sm:p-10 mb-8 text-white shadow-xl shadow-blue-500/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold mb-4 backdrop-blur-sm border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Yjs YATA Conflict-Free Replicated Data Type</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Real-Time Collaborative Document Engine
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl text-sm sm:text-base leading-relaxed">
              Simultaneous multi-user editing with zero data loss or race conditions.
              Features sub-millisecond CRDT merging, live presence carets, and dual-layer offline persistence.
            </p>

            {/* Document Creation Box */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mb-8">
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createNewDocument()}
                placeholder="Enter document title (optional)..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20 text-sm backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={createNewDocument}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-md cursor-pointer whitespace-nowrap text-sm"
              >
                <Plus size={18} />
                New Document
              </button>
            </div>

            {/* Technical Pillars Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-blue-100 border-t border-white/10 pt-6">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-cyan-300" />
                <span>Live Cursor Carets</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi size={16} className="text-emerald-300" />
                <span>Dual-Tier Offline Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-purple-300" />
                <span>Zero Last-Write-Wins</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-300" />
                <span>SHA-256 State Hash</span>
              </div>
            </div>
          </div>

          {/* Join existing document bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Join Existing Workspace
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinDocument()}
                placeholder="Paste document ID or full URL link..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
              />
              <button
                type="button"
                onClick={joinDocument}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                <ArrowRight size={16} />
                <span>Join</span>
              </button>
            </div>
          </div>

          {/* Document list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Your Recent Documents</h3>
              <span className="text-xs text-slate-500">{documents.length} stored locally</span>
            </div>

            {documents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <FileText size={44} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-700 font-semibold mb-1">No documents created yet</p>
                <p className="text-slate-400 text-xs">
                  Click &quot;New Document&quot; above to create your first collaborative canvas.
                </p>
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
                      onClick={() => openDocument(doc.id)}
                      className="flex items-center gap-3.5 flex-1 text-left cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
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

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {/* Copy Editor Link */}
                      <button
                        type="button"
                        onClick={() => copyShareLink(doc.id, "editor")}
                        className="text-xs px-2.5 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
                        title="Copy Editor Share Link"
                      >
                        <Share2 size={13} />
                        <span>{copiedId === `${doc.id}-editor` ? "Copied!" : "Share Link"}</span>
                      </button>

                      {/* Copy Viewer Link */}
                      <button
                        type="button"
                        onClick={() => copyShareLink(doc.id, "viewer")}
                        className="text-xs px-2.5 py-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
                        title="Copy Read-Only Viewer Link"
                      >
                        <Lock size={12} />
                        <span>{copiedId === `${doc.id}-viewer` ? "Copied!" : "Viewer Link"}</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => deleteDocument(doc.id)}
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

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-400 border-t border-slate-200 w-full mt-10">
        <p>DocFix Collaborative Engine · Built with Yjs (CRDT) · TipTap v3 · Next.js · WebSocket</p>
      </footer>
    </div>
  );
}