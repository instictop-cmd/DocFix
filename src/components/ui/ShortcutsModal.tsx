"use client";
"use no memo";

import { useState, useEffect } from "react";
import {
  Keyboard,
  X,
  Sparkles,
  Save,
  Search,
  Type,
  List,
  Command,
  HelpCircle,
  EyeOff,
} from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

interface ShortcutItem {
  name: string;
  keys: string[];
}

interface ShortcutCategory {
  category: string;
  icon: React.ReactNode;
  items: ShortcutItem[];
}

export default function ShortcutsModal({
  isOpen,
  onClose,
  isDark,
}: ShortcutsModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCompletelyHidden, setIsCompletelyHidden] = useState(false);

  useEffect(() => {
    const savedHidden = localStorage.getItem("docfix-hide-shortcuts-pill");
    if (savedHidden === "true") {
      setIsCompletelyHidden(true);
    }
  }, []);

  const hidePillPermanently = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompletelyHidden(true);
    localStorage.setItem("docfix-hide-shortcuts-pill", "true");
  };

  const SHORTCUT_GROUPS: ShortcutCategory[] = [
    {
      category: "DocPilot AI",
      icon: <Sparkles size={14} className="text-purple-500" />,
      items: [
        { name: "DocPilot AI Copilot", keys: ["⌘", "J"] },
        { name: "Summarize / Polish / Action Items", keys: ["⌘", "J"] },
      ],
    },
    {
      category: "Document & Tools",
      icon: <Save size={14} className="text-indigo-500" />,
      items: [
        { name: "Save Checkpoint Snapshot", keys: ["⌘", "S"] },
        { name: "Find & Replace in Doc", keys: ["⌘", "F"] },
        { name: "Shortcuts Cheat Sheet", keys: ["⌘", "/"] },
      ],
    },
    {
      category: "Formatting Marks",
      icon: <Type size={14} className="text-blue-500" />,
      items: [
        { name: "Bold", keys: ["⌘", "B"] },
        { name: "Italic", keys: ["⌘", "I"] },
        { name: "Underline", keys: ["⌘", "U"] },
        { name: "Strikethrough", keys: ["⌘", "⇧", "X"] },
        { name: "Inline Code", keys: ["⌘", "E"] },
      ],
    },
    {
      category: "Structure & Lists",
      icon: <List size={14} className="text-emerald-500" />,
      items: [
        { name: "Heading 1 / 2 / 3", keys: ["⌘", "⌥", "1-3"] },
        { name: "Bullet List", keys: ["⌘", "⇧", "8"] },
        { name: "Numbered List", keys: ["⌘", "⇧", "7"] },
        { name: "Interactive Checklist", keys: ["⌘", "⇧", "9"] },
      ],
    },
    {
      category: "History & Navigation",
      icon: <Command size={14} className="text-amber-500" />,
      items: [
        { name: "Undo Edit", keys: ["⌘", "Z"] },
        { name: "Redo Edit", keys: ["⌘", "Y"] },
        { name: "Cycle Next Match in Find", keys: ["Enter"] },
        { name: "Close Any Modal / Dialog", keys: ["Esc"] },
      ],
    },
  ];

  return (
    <>
      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className={`rounded-2xl shadow-2xl border flex flex-col w-full max-w-2xl max-h-[85vh] transition-all zoom-in-95 duration-150 ${
              isDark
                ? "bg-gray-900 border-gray-800 text-gray-100 shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
                : "bg-white border-gray-200 text-gray-900 shadow-[0_16px_48px_rgba(0,0,0,0.15)]"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-5 py-4 border-b ${
                isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Keyboard size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                    Keyboard Shortcuts Manual
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Boost your productivity with keyboard superpowers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Grid */}
            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SHORTCUT_GROUPS.map((group) => (
                <div
                  key={group.category}
                  className={`p-3.5 rounded-xl border ${
                    isDark
                      ? "bg-gray-800/40 border-gray-800"
                      : "bg-gray-50/70 border-gray-200/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-2.5 font-semibold text-xs text-gray-700 dark:text-gray-300">
                    {group.icon}
                    <span>{group.category}</span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k) => (
                            <kbd
                              key={k}
                              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border shadow-2xs ${
                                isDark
                                  ? "bg-gray-800 border-gray-700 text-gray-200"
                                  : "bg-white border-gray-200 text-gray-700"
                              }`}
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              className={`px-5 py-3 border-t text-[11px] text-gray-500 flex items-center justify-between select-none ${
                isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50/50"
              }`}
            >
              <span>
                Tip: Press <kbd className="px-1 py-0.2 bg-gray-200 dark:bg-gray-800 rounded font-semibold">⌘ /</kbd> anywhere to toggle this cheat sheet.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs cursor-pointer transition-all active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
