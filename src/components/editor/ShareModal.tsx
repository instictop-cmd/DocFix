"use client";
"use no memo";

import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Mail,
  Lock,
  Globe,
  Users,
  Send,
  Shield,
  Eye,
  Edit3,
  ExternalLink,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  isDark?: boolean;
}

export default function ShareModal({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  isDark = false,
}: ShareModalProps) {
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [emailInput, setEmailInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/document/${documentId}${role === "viewer" ? "?role=viewer" : ""}`;
  const docName = documentTitle || "Untitled Document";
  const roleLabel = role === "editor" ? "Editor (Can edit & collaborate)" : "Viewer (Read-only)";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setStatusMessage("Link copied to clipboard!");
    setTimeout(() => {
      setCopied(false);
      setStatusMessage(null);
    }, 2500);
  };

  const getEmailContent = () => {
    const subject = `Invitation to collaborate on "${docName}" - DocFix`;
    const body = `Hi,\n\nI have invited you to collaborate on the document "${docName}" in DocFix as a ${roleLabel}.\n\nClick the link below to open and edit together in real-time:\n${shareUrl}\n\nHappy Collaborating,\nDocFix Real-Time Team`;
    return { subject, body };
  };

  // Direct Web Gmail Opener
  const handleOpenGmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const { subject, body } = getEmailContent();
    const targetEmail = emailInput.trim();

    // Direct Google Mail web compose URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      targetEmail
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(gmailUrl, "_blank", "noopener,noreferrer");
    setStatusMessage("Opening Gmail composer in new tab...");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl shadow-2xl p-6 sm:p-7 max-w-lg w-full border transition-all animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? "bg-gray-900 border-gray-800 text-gray-100"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              📄
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                Share &quot;{docName}&quot;
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Invite collaborators directly via Gmail or shareable link
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

        {/* 1. Gmail Invitation Section */}
        <form onSubmit={handleOpenGmail} className="mb-5">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Send Invitation via Gmail
          </label>
          <div className="space-y-2.5">
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="colleague@gmail.com (or leave empty to open compose)..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                }`}
              />
            </div>

            {/* Direct Gmail Web Compose Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Open directly in Gmail web composer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.272H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
              </svg>
              <span>Share via Gmail</span>
              <ExternalLink size={13} className="opacity-75" />
            </button>
          </div>
        </form>

        {statusMessage && (
          <div className="mb-4 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium flex items-center gap-1.5 animate-in fade-in duration-150">
            <Check size={13} />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="relative flex py-1.5 items-center mb-4">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
          <span className="flex-shrink mx-3 text-xs text-gray-400 font-medium">
            Permission & Access
          </span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
        </div>

        {/* 2. Permission Selector (Editor vs Viewer) */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Globe size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Anyone with the link
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Choose access permission for collaborators
                </p>
              </div>
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-200"
                  : "bg-white border-gray-200 text-gray-800"
              }`}
            >
              <option value="editor">✏️ Editor (Can edit)</option>
              <option value="viewer">👁️ Viewer (Read only)</option>
            </select>
          </div>
        </div>

        {/* 3. Copy Link Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              copied
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : isDark
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200"
            }`}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? "Link Copied!" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
