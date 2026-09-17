"use client";
"use no memo";

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { Editor } from "@tiptap/react";
import {
  History,
  X,
  RotateCcw,
  Bookmark,
  Calendar,
  User,
  FileText,
  Check,
  AlertTriangle,
  Clock,
  Plus,
} from "lucide-react";

export interface DocSnapshot {
  id: string;
  name: string;
  author: string;
  timestamp: number;
  wordCount: number;
  contentHTML: string;
  contentText: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ydoc: Y.Doc;
  editor: Editor;
  currentUserName: string;
  isDark?: boolean;
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  ydoc,
  editor,
  currentUserName,
  isDark = false,
}: VersionHistoryModalProps) {
  const [snapshots, setSnapshots] = useState<DocSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const historyArrayRef = useRef(ydoc.getArray<DocSnapshot>("version_history"));

  // Sync snapshot list from Yjs array
  useEffect(() => {
    const historyArray = historyArrayRef.current;

    const updateSnapshots = () => {
      const all = historyArray.toArray();
      // Newest first
      const sorted = [...all].sort((a, b) => b.timestamp - a.timestamp);
      setSnapshots(sorted);
      if (sorted.length > 0 && !selectedSnapshotId) {
        setSelectedSnapshotId(sorted[0].id);
      }
    };

    historyArray.observe(updateSnapshots);
    updateSnapshots();

    return () => {
      historyArray.unobserve(updateSnapshots);
    };
  }, [selectedSnapshotId]);

  if (!isOpen) return null;

  // Create a new snapshot
  const handleSaveSnapshot = (customName?: string) => {
    const html = editor.getHTML();
    const text = editor.getText();
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const label = customName || snapshotLabel.trim() || `Revision (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;

    const newSnapshot: DocSnapshot = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: label,
      author: currentUserName,
      timestamp: Date.now(),
      wordCount: words,
      contentHTML: html,
      contentText: text,
    };

    historyArrayRef.current.push([newSnapshot]);
    setSelectedSnapshotId(newSnapshot.id);
    setSnapshotLabel("");
    setShowCreateInput(false);
  };

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId);

  // Restore snapshot into editor
  const handleRestore = () => {
    if (!selectedSnapshot) return;
    const confirm = window.confirm(
      `Are you sure you want to restore the version "${selectedSnapshot.name}"? Current unsaved edits will be replaced.`
    );
    if (!confirm) return;

    // First create an automatic safety checkpoint of current state before restoring
    handleSaveSnapshot(`Auto-backup before restoring "${selectedSnapshot.name}"`);

    // Restore content in TipTap
    editor.commands.setContent(selectedSnapshot.contentHTML);

    setRestoreSuccess(true);
    setTimeout(() => {
      setRestoreSuccess(false);
      onClose();
    }, 1500);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl shadow-2xl border flex flex-col w-full max-w-4xl h-[620px] transition-all animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? "bg-gray-900 border-gray-800 text-gray-100"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <History size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight flex items-center gap-2">
                Document Version History
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-full">
                  {snapshots.length} Snapshots
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Browse CRDT snapshots, compare states, and restore earlier revisions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body (Split Layout: Left List, Right Preview) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Snapshot Timeline */}
          <div
            className={`w-72 sm:w-80 border-r flex flex-col ${
              isDark ? "border-gray-800 bg-gray-900/60" : "border-gray-200 bg-gray-50/50"
            }`}
          >
            {/* Action Bar */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              {showCreateInput ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={snapshotLabel}
                    onChange={(e) => setSnapshotLabel(e.target.value)}
                    placeholder="Checkpoint name (e.g. v1.0)..."
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark
                        ? "bg-gray-800 border-gray-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveSnapshot();
                    }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSaveSnapshot()}
                      className="flex-1 py-1 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateInput(false)}
                      className="py-1 px-2.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateInput(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Save Current Snapshot</span>
                </button>
              )}
            </div>

            {/* Snapshot Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {snapshots.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  <Clock size={24} className="mx-auto mb-2 opacity-40" />
                  <p>No snapshots yet.</p>
                  <p className="text-[11px] mt-1">Click &quot;Save Current Snapshot&quot; above to create one!</p>
                </div>
              ) : (
                snapshots.map((snap) => {
                  const isSelected = snap.id === selectedSnapshotId;
                  return (
                    <div
                      key={snap.id}
                      onClick={() => setSelectedSnapshotId(snap.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-300"
                          : isDark
                            ? "bg-gray-800/40 border-gray-800/80 hover:bg-gray-800 text-gray-300"
                            : "bg-white border-gray-200/80 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs truncate max-w-[170px]">
                          {snap.name}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {snap.wordCount} words
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] opacity-60">
                        <span className="flex items-center gap-1 truncate">
                          <User size={10} /> {snap.author}
                        </span>
                        <span>{formatDate(snap.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Preview Pane */}
          <div
            className={`flex-1 flex flex-col ${
              isDark ? "bg-gray-950" : "bg-gray-100/50"
            }`}
          >
            {selectedSnapshot ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Preview Toolbar */}
                <div
                  className={`flex items-center justify-between px-5 py-3 border-b ${
                    isDark ? "bg-gray-900/80 border-gray-800" : "bg-white border-gray-200"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {selectedSnapshot.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Saved by <strong>{selectedSnapshot.author}</strong> on{" "}
                      {formatDate(selectedSnapshot.timestamp)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestore}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {restoreSuccess ? (
                      <>
                        <Check size={14} />
                        <span>Restored!</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw size={14} />
                        <span>Restore This Version</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preview Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div
                    className={`max-w-2xl mx-auto p-6 rounded-xl border shadow-xs min-h-[350px] ${
                      isDark
                        ? "bg-gray-900 border-gray-800 text-gray-100"
                        : "bg-white border-gray-200 text-gray-900"
                    }`}
                  >
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedSnapshot.contentHTML }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
                Select a snapshot from the timeline to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
