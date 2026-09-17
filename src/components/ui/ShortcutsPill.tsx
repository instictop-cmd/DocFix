"use client";
"use no memo";

import { useState, useEffect } from "react";
import { Keyboard, X, HelpCircle } from "lucide-react";

interface ShortcutsPillProps {
  onOpen: () => void;
  isDark: boolean;
}

export default function ShortcutsPill({ onOpen, isDark }: ShortcutsPillProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("docfix-shortcuts-pill-dismissed");
    if (saved === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem("docfix-shortcuts-pill-dismissed", "true");
  };

  if (isDismissed) {
    // When dismissed, show an ultra-subtle mini '?' button on hover
    return (
      <div className="fixed bottom-10 right-4 z-30 group">
        <button
          type="button"
          onClick={() => {
            setIsDismissed(false);
            localStorage.removeItem("docfix-shortcuts-pill-dismissed");
            onOpen();
          }}
          className={`w-7 h-7 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 transition-all cursor-pointer shadow-xs border text-xs font-bold ${
            isDark
              ? "bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-800"
              : "bg-white/80 border-gray-200 text-gray-600 hover:bg-white"
          }`}
          title="Keyboard Shortcuts (⌘/)"
        >
          <HelpCircle size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-10 right-4 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={onOpen}
        className={`flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full shadow-lg border backdrop-blur-md cursor-pointer transition-all hover:scale-102 select-none ${
          isDark
            ? "bg-gray-900/90 border-gray-700/80 text-gray-200 hover:border-gray-600 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            : "bg-white/95 border-gray-200/90 text-gray-700 hover:border-gray-300 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Keyboard size={13} className="text-blue-500" />
          <span className="text-xs font-semibold">Shortcuts</span>
          <kbd
            className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
              isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"
            }`}
          >
            ⌘/
          </kbd>
        </div>

        {/* Hide / Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer ml-0.5 ${
            isHovered ? "opacity-100" : "opacity-60"
          }`}
          title="Minimize to '?' icon"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
