"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Plus, FileText, ArrowRight, Trash2, Users, Wifi } from "lucide-react";

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

  const [newDocTitle, setNewDocTitle] = useState("");

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

    // Check if it's a full URL or just an ID
    const match = id.match(/\/document\/(.+)/);
    const docId = match ? match[1] : id;

    // Add to local list if not already there
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">📝 Synora</h1>
          <p className="text-sm text-gray-500">
            Real-Time Collaborative Editor
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">
            Collaborate in Real Time
          </h2>
          <p className="text-blue-100 mb-6 max-w-xl">
            Create a document, share the link, and edit together. Changes sync
            instantly using CRDT technology — no conflicts, no data loss.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNewDocument()}
              placeholder="Enter document title (optional)..."
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20 text-sm sm:text-base backdrop-blur-sm"
            />
            <button
              type="button"
              onClick={createNewDocument}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap text-sm sm:text-base"
            >
              <Plus size={20} />
              New Document
            </button>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-6 mt-6 text-sm text-blue-200">
            <div className="flex items-center gap-1.5">
              <Users size={16} />
              Live Cursors
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi size={16} />
              Offline Support
            </div>
            <div className="flex items-center gap-1.5">
              <FileText size={16} />
              Auto-Save
            </div>
          </div>
        </div>

        {/* Join existing document */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Join a Shared Document
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinDocument()}
              placeholder="Paste document ID or link..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={joinDocument}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <ArrowRight size={18} />
              Join
            </button>
          </div>
        </div>

        {/* Document list */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Your Documents
          </h3>

          {documents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No documents yet</p>
              <p className="text-gray-400 text-sm">
                Click &quot;New Document&quot; to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <button
                    type="button"
                    onClick={() => openDocument(doc.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        Opened {formatDate(doc.lastOpened)}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          `${window.location.origin}/document/${doc.id}`
                        );
                        alert("Link copied to clipboard!");
                      }}
                      className="text-xs px-3 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Share Link
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocument(doc.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
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

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-8 text-center text-sm text-gray-400">
        Built with Next.js · TipTap · Yjs CRDT · WebSocket
      </footer>
    </div>
  );
}