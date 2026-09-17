"use client";
"use no memo";

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { Editor } from "@tiptap/react";
import { DocSnapshot, createSnapshot } from "../../lib/snapshotUtils";
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
    const label = customName || snapshotLabel.trim() || `Revision (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;

    const snapshot = createSnapshot(ydoc, editor, currentUserName, label, { skipDuplicateCheck: true });
    if (snapshot) {
      setSelectedSnapshotId(snapshot.id);
    }
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
            isDark ? "border-stone-800 bg-[#1E1B18]" : "border-stone-200/80 bg-[#FAF7F2]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <History size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 leading-tight flex items-center gap-2">
                Document Version History
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-orange-50 text-orange-800 border border-orange-200/60 rounded-full">
                  {snapshots.length} Snapshots
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Browse CRDT snapshots, compare states, and restore earlier revisions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body (Split Layout: Left List, Right Preview) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Snapshot Timeline */}
          <div
            className={`w-72 sm:w-80 border-r flex flex-col ${
              isDark ? "border-stone-800 bg-stone-900/60" : "border-stone-200/80 bg-[#FAF7F2]/60"
            }`}
          >
            {/* Action Bar */}
            <div className="p-3 border-b border-stone-200 dark:border-stone-800">
              {showCreateInput ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={snapshotLabel}
                    onChange={(e) => setSnapshotLabel(e.target.value)}
                    placeholder="Checkpoint name (e.g. v1.0)..."
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-400/50 ${
                      isDark
                        ? "bg-stone-800 border-stone-700 text-white"
                        : "bg-white border-stone-300 text-stone-900"
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
                      className="flex-1 py-1 px-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateInput(false)}
                      className="py-1 px-2.5 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateInput(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-orange-500/20 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Save Current Snapshot</span>
                </button>
              )}
            </div>

            {/* Snapshot Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {snapshots.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-400">
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
                          ? "bg-orange-500/10 border-orange-500/40 text-orange-700 dark:text-orange-300"
                          : isDark
                            ? "bg-stone-800/40 border-stone-800/80 hover:bg-stone-800 text-stone-300"
                            : "bg-white border-stone-200/80 hover:border-orange-200 hover:bg-white text-stone-700"
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
              isDark ? "bg-[#141210]" : "bg-[#FAF7F2]/40"
            }`}
          >
            {selectedSnapshot ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Preview Toolbar */}
                <div
                  className={`flex items-center justify-between px-5 py-3 border-b ${
                    isDark ? "bg-stone-900/80 border-stone-800" : "bg-white border-stone-200/80"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {selectedSnapshot.name}
                    </h4>
                    <p className="text-xs text-stone-500">
                      Saved by <strong>{selectedSnapshot.author}</strong> on{" "}
                      {formatDate(selectedSnapshot.timestamp)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestore}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-orange-500/20 cursor-pointer"
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
