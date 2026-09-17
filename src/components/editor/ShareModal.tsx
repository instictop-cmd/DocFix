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
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/document/${documentId}${role === "viewer" ? "?role=viewer" : ""}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    // Generate mailto link with pre-filled subject and body
    const subject = encodeURIComponent(`Invitation to collaborate on: ${documentTitle || "Document"}`);
    const body = encodeURIComponent(
      `Hi,\n\nI've invited you to collaborate on "${documentTitle || "Untitled Document"}" on DocFix as a ${role === "editor" ? "Editor (Can edit)" : "Viewer (Read-only)"}.\n\nClick the link below to open and start editing in real-time:\n${shareUrl}\n\nBest regards,\nDocFix Team`
    );

    window.open(`mailto:${emailInput.trim()}?subject=${subject}&body=${body}`, "_blank");
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
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
                Share &quot;{documentTitle || "Untitled Document"}&quot;
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Invite team members via email or shareable link
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

        {/* 1. Email Invitation Input */}
        <form onSubmit={handleSendEmail} className="mb-6">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Send Email Invitation
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="colleague@example.com..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                }`}
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Send size={14} />
              <span>{emailSent ? "Opened Mail!" : "Send Invite"}</span>
            </button>
          </div>
        </form>

        <div className="relative flex py-2 items-center mb-5">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
          <span className="flex-shrink mx-3 text-xs text-gray-400 font-medium">
            General Access & Permissions
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
                  Choose access role for collaborators
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
            <span>{copied ? "Link Copied to Clipboard!" : "Copy Link"}</span>
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
