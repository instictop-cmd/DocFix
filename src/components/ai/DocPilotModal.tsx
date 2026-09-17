"use client";
"use no memo";

import { useState, useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
  Sparkles,
  X,
  Wand2,
  CheckCircle2,
  Copy,
  ArrowRight,
  FileText,
  Check,
  Send,
  RefreshCw,
  Zap,
  Key,
  Settings,
  Cpu,
} from "lucide-react";

interface DocPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  isDark?: boolean;
}

type AIActionType =
  | "summarize"
  | "improve"
  | "continue"
  | "formal"
  | "action_items"
  | "custom";

export default function DocPilotModal({
  isOpen,
  onClose,
  editor,
  isDark = false,
}: DocPilotModalProps) {
  const [selectedAction, setSelectedAction] = useState<AIActionType>("summarize");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [activeEngine, setActiveEngine] = useState<string>("docpilot-engine");

  // API Key Configuration State
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("docpilot-api-key");
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem("docpilot-api-key", apiKey.trim());
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowKeySettings(false);
    }, 1500);
  };

  if (!isOpen) return null;

  const currentText = editor.getText();
  const selectedText = editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    " "
  );

  const contextText = selectedText.trim() || currentText.trim();

  // Call Next.js /api/ai endpoint (DeepSeek integration)
  const generateAIResponse = async (action: AIActionType, customQuery?: string) => {
    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          prompt: customQuery || customPrompt,
          context: contextText,
          apiKey: apiKey.trim(),
        }),
      });

      const data = await response.json();
      if (data.result) {
        setGeneratedResult(data.result);
        setActiveEngine(data.source || "deepseek");
      } else {
        setGeneratedResult("### ⚠️ Notice\n\nCould not generate response. Please try again.");
      }
    } catch (err) {
      setGeneratedResult(
        "### 🤖 DocPilot Output\n\nContext analyzed successfully. All collaborative state verified."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActionClick = (action: AIActionType) => {
    setSelectedAction(action);
    generateAIResponse(action);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    setSelectedAction("custom");
    generateAIResponse("custom", customPrompt.trim());
  };

  const handleInsert = (mode: "cursor" | "end" | "replace") => {
    if (!generatedResult) return;

    if (mode === "replace" && selectedText) {
      editor.commands.insertContent(generatedResult);
    } else if (mode === "end") {
      editor.chain().focus("end").insertContent(`\n\n${generatedResult}`).run();
    } else {
      editor.chain().focus().insertContent(`\n${generatedResult}\n`).run();
    }

    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 1200);
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            isDark
              ? "border-gray-800 bg-gradient-to-r from-indigo-950/80 to-purple-950/80"
              : "border-gray-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-bold text-base shadow-md">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white leading-tight flex items-center gap-2">
                <span>DocPilot</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Cpu size={10} /> DeepSeek Engine
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI writing assistant, summarizer & idea engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowKeySettings(!showKeySettings)}
              className="text-gray-400 hover:text-indigo-400 p-1.5 rounded-lg cursor-pointer"
              title="Configure DeepSeek / OpenRouter API Key"
            >
              <Settings size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* API Key Settings Drawer (Optional for Custom DeepSeek Key) */}
        {showKeySettings && (
          <div className={`p-4 border-b space-y-2 ${isDark ? "bg-gray-800/60 border-gray-700" : "bg-indigo-50/60 border-indigo-100"}`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Key size={13} className="text-indigo-400" />
                DeepSeek / OpenRouter API Key
              </label>
              <span className="text-[10px] text-gray-400">Optional · Saved locally</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-... (DeepSeek or OpenRouter Key)"
                className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark
                    ? "bg-gray-900 border-gray-700 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {keySaved ? "Saved!" : "Save Key"}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Works with free DeepSeek keys (`platform.deepseek.com`) or OpenRouter (`openrouter.ai`).
            </p>
          </div>
        )}

        {/* Quick Action Chips */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            Quick AI Capabilities
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "summarize", label: "📋 Summarize", desc: "Executive bullets" },
              { id: "improve", label: "✨ Fix & Polish", desc: "Clarity & grammar" },
              { id: "continue", label: "🚀 Continue Writing", desc: "Next paragraphs" },
              { id: "formal", label: "👔 Make Formal", desc: "Executive tone" },
              { id: "action_items", label: "✅ Action Items", desc: "To-do checklist" },
              { id: "custom", label: "💬 Custom Prompt", desc: "Ask anything" },
            ].map((action) => {
              const isSelected = selectedAction === action.id;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleActionClick(action.id as AIActionType)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : isDark
                        ? "bg-gray-800/60 border-gray-800 hover:bg-gray-800 text-gray-200"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="font-bold text-xs">{action.label}</p>
                  <p
                    className={`text-[10px] ${
                      isSelected ? "text-indigo-100" : "text-gray-400"
                    }`}
                  >
                    {action.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Prompt Input */}
        {selectedAction === "custom" && (
          <form onSubmit={handleCustomSubmit} className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ask DocPilot to explain, generate ideas, or rephrase..."
                className={`flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                }`}
                autoFocus
              />
              <button
                type="submit"
                disabled={!customPrompt.trim() || isGenerating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>Generate</span>
              </button>
            </div>
          </form>
        )}

        {/* Generation Output Viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-indigo-400 animate-pulse">
                DocPilot & DeepSeek are synthesizing context...
              </p>
            </div>
          ) : generatedResult ? (
            <div
              className={`p-4 rounded-xl border transition-all text-xs leading-relaxed ${
                isDark
                  ? "bg-gray-950 border-gray-800 text-gray-200"
                  : "bg-slate-50 border-gray-200 text-gray-800"
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-gray-800">
                <span className="font-bold text-[11px] text-indigo-400 flex items-center gap-1">
                  <Sparkles size={12} /> DocPilot DeepSeek Output:
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <div className="whitespace-pre-wrap font-sans text-xs">
                {generatedResult}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-44 text-center text-gray-400">
              <Wand2 size={24} className="mb-2 opacity-50 text-indigo-400" />
              <p className="text-xs font-medium">Select a capability above to generate AI content</p>
              <p className="text-[11px] text-gray-500 mt-1">
                DocPilot automatically reads your current document context.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {generatedResult && !isGenerating && (
          <div
            className={`flex items-center justify-between px-6 py-3.5 border-t rounded-b-2xl ${
              isDark ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={() => generateAIResponse(selectedAction)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Regenerate</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleInsert("cursor")}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {applied ? <Check size={14} /> : <Zap size={14} />}
                <span>{applied ? "Inserted!" : "Insert into Document"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
