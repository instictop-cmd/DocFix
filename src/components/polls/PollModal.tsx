"use client";
"use no memo";

import { useState, useEffect, useRef } from "react";
import * as Y from "yjs";
import { Editor } from "@tiptap/react";
import {
  Vote,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  BarChart3,
  FileText,
  User,
  Check,
} from "lucide-react";

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // List of userNames who voted
}

export interface PollItem {
  id: string;
  question: string;
  creator: string;
  timestamp: number;
  options: PollOption[];
  isClosed?: boolean;
}

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  ydoc: Y.Doc;
  editor: Editor;
  currentUserName: string;
  isDark?: boolean;
}

export default function PollModal({
  isOpen,
  onClose,
  ydoc,
  editor,
  currentUserName,
  isDark = false,
}: PollModalProps) {
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["", ""]);
  const [insertedPollId, setInsertedPollId] = useState<string | null>(null);

  const pollsArrayRef = useRef(ydoc.getArray<PollItem>("live_polls"));

  useEffect(() => {
    const pollsArray = pollsArrayRef.current;

    const updatePolls = () => {
      const all = pollsArray.toArray();
      const sorted = [...all].sort((a, b) => b.timestamp - a.timestamp);
      setPolls(sorted);
    };

    pollsArray.observe(updatePolls);
    updatePolls();

    return () => {
      pollsArray.unobserve(updatePolls);
    };
  }, []);

  if (!isOpen) return null;

  // Add an option field in the create form
  const handleAddOptionField = () => {
    if (newOptions.length < 6) {
      setNewOptions([...newOptions, ""]);
    }
  };

  // Remove option field
  const handleRemoveOptionField = (index: number) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, i) => i !== index));
    }
  };

  // Create new poll
  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuestion = newQuestion.trim();
    const cleanOpts = newOptions.map((o) => o.trim()).filter(Boolean);

    if (!cleanQuestion || cleanOpts.length < 2) return;

    const newPoll: PollItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question: cleanQuestion,
      creator: currentUserName,
      timestamp: Date.now(),
      options: cleanOpts.map((text, idx) => ({
        id: `opt-${idx}-${Date.now()}`,
        text,
        votes: [],
      })),
      isClosed: false,
    };

    pollsArrayRef.current.push([newPoll]);
    setNewQuestion("");
    setNewOptions(["", ""]);
    setShowCreateForm(false);
  };

  // Vote on option
  const handleVote = (pollId: string, optionId: string) => {
    const array = pollsArrayRef.current;
    const all = array.toArray();
    const index = all.findIndex((p) => p.id === pollId);
    if (index === -1) return;

    const currentPoll = all[index];
    if (currentPoll.isClosed) return;

    // Toggle or cast vote
    const updatedOptions = currentPoll.options.map((opt) => {
      // Remove current user vote from all options
      const filteredVotes = opt.votes.filter((u) => u !== currentUserName);
      if (opt.id === optionId) {
        // If they hadn't voted for this option, add them
        if (!opt.votes.includes(currentUserName)) {
          filteredVotes.push(currentUserName);
        }
      }
      return { ...opt, votes: filteredVotes };
    });

    const updatedPoll: PollItem = {
      ...currentPoll,
      options: updatedOptions,
    };

    // Yjs update
    ydoc.transact(() => {
      array.delete(index, 1);
      array.insert(index, [updatedPoll]);
    });
  };

  // Insert poll results into editor document
  const handleInsertResultsToDoc = (poll: PollItem) => {
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    const rows = poll.options.map((opt) => {
      const count = opt.votes.length;
      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return `- **${opt.text}**: ${count} vote${count === 1 ? "" : "s"} (${pct}%)`;
    });

    const markdown = `### 📊 Live Poll: ${poll.question}\n*Created by ${poll.creator} · Total Votes: ${totalVotes}*\n\n${rows.join(
      "\n"
    )}\n\n`;

    editor.chain().focus().insertContent(markdown).run();
    setInsertedPollId(poll.id);
    setTimeout(() => setInsertedPollId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl shadow-2xl border flex flex-col w-full max-w-2xl max-h-[640px] transition-all animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? "bg-gray-900 border-gray-800 text-gray-100"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b rounded-t-2xl ${
            isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-base shadow-md">
              <Vote size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white leading-tight flex items-center gap-2">
                <span>Collaborative Polls</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full uppercase tracking-wider">
                  Live Voting
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Create consensus polls & vote in real-time with your team
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

        {/* Create Form Toggle Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {polls.length} Active Poll{polls.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {showCreateForm ? <X size={13} /> : <Plus size={13} />}
            <span>{showCreateForm ? "Close Form" : "Create New Poll"}</span>
          </button>
        </div>

        {/* Create Poll Form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreatePoll}
            className={`p-5 border-b border-gray-200 dark:border-gray-800 space-y-3 ${
              isDark ? "bg-gray-800/40" : "bg-amber-50/40"
            }`}
          >
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Poll Question
              </label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g. Which API architecture should we use for v2?"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                }`}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Options (Minimum 2)
              </label>
              {newOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const copy = [...newOptions];
                      copy[idx] = e.target.value;
                      setNewOptions(copy);
                    }}
                    placeholder={`Option ${idx + 1}...`}
                    className={`flex-1 px-3.5 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark
                        ? "bg-gray-800 border-gray-700 text-white"
                        : "bg-white border-gray-200 text-gray-900"
                    }`}
                  />
                  {newOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionField(idx)}
                      className="text-gray-400 hover:text-red-500 p-1.5 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}

              {newOptions.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOptionField}
                  className="text-xs text-amber-500 font-semibold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <Plus size={12} /> Add another option
                </button>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!newQuestion.trim() || newOptions.filter((o) => o.trim()).length < 2}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Publish Live Poll
              </button>
            </div>
          </form>
        )}

        {/* Polls List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {polls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
              <BarChart3 size={28} className="mb-2 opacity-40 text-amber-500" />
              <p className="text-xs font-medium">No live polls active yet</p>
              <p className="text-[11px] text-gray-500 mt-1">
                Click &quot;Create New Poll&quot; to start real-time voting with collaborators!
              </p>
            </div>
          ) : (
            polls.map((poll) => {
              const totalVotes = poll.options.reduce(
                (sum, opt) => sum + opt.votes.length,
                0
              );
              return (
                <div
                  key={poll.id}
                  className={`p-4.5 rounded-2xl border transition-all ${
                    isDark
                      ? "bg-gray-800/40 border-gray-800"
                      : "bg-gray-50/80 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                      {poll.question}
                    </h4>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {totalVotes} vote{totalVotes === 1 ? "" : "s"}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-400 mb-3">
                    Created by <strong>{poll.creator}</strong>
                  </p>

                  {/* Options & Live Progress Bars */}
                  <div className="space-y-2.5">
                    {poll.options.map((opt) => {
                      const voteCount = opt.votes.length;
                      const percentage =
                        totalVotes > 0
                          ? Math.round((voteCount / totalVotes) * 100)
                          : 0;
                      const hasVoted = opt.votes.includes(currentUserName);

                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleVote(poll.id, opt.id)}
                          className={`relative overflow-hidden rounded-xl border p-2.5 cursor-pointer transition-all ${
                            hasVoted
                              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5"
                              : isDark
                                ? "border-gray-700 hover:border-gray-600 bg-gray-900/60"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          {/* Animated Progress Background */}
                          <div
                            className={`absolute top-0 bottom-0 left-0 transition-all duration-300 ${
                              hasVoted
                                ? "bg-amber-500/20"
                                : isDark
                                  ? "bg-gray-700/40"
                                  : "bg-gray-100"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />

                          <div className="relative z-10 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  hasVoted
                                    ? "border-amber-500 bg-amber-500 text-white"
                                    : "border-gray-400"
                                }`}
                              >
                                {hasVoted && <Check size={10} />}
                              </div>
                              <span
                                className={`font-medium ${
                                  hasVoted
                                    ? "font-bold text-amber-600 dark:text-amber-400"
                                    : ""
                                }`}
                              >
                                {opt.text}
                              </span>
                            </div>

                            <span className="font-bold text-gray-500 dark:text-gray-400">
                              {percentage}% ({voteCount})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Insert results to document */}
                  <div className="flex items-center justify-end pt-3 mt-2 border-t border-gray-200 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => handleInsertResultsToDoc(poll)}
                      className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-semibold"
                    >
                      <FileText size={13} />
                      <span>
                        {insertedPollId === poll.id
                          ? "Results Inserted!"
                          : "Insert Results into Doc"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
