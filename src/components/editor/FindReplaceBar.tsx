"use client";
"use no memo";

import { useEffect, useState, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Replace,
  CaseSensitive,
  Sparkles,
} from "lucide-react";

interface FindReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  isDark: boolean;
}

interface MatchRange {
  from: number;
  to: number;
}

export default function FindReplaceBar({
  isOpen,
  onClose,
  editor,
  isDark,
}: FindReplaceBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [matches, setMatches] = useState<MatchRange[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scan editor ProseMirror doc for matching ranges
  const findMatches = useCallback(() => {
    if (!editor || !searchTerm.trim()) {
      setMatches([]);
      setCurrentIndex(0);
      return;
    }

    const { doc } = editor.state;
    const found: MatchRange[] = [];
    const search = isCaseSensitive ? searchTerm : searchTerm.toLowerCase();

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const text = isCaseSensitive ? node.text : node.text.toLowerCase();
        let startIndex = 0;
        while ((startIndex = text.indexOf(search, startIndex)) !== -1) {
          found.push({
            from: pos + startIndex,
            to: pos + startIndex + search.length,
          });
          startIndex += search.length;
        }
      }
    });

    setMatches(found);
    if (found.length > 0) {
      // Focus on the first match
      setCurrentIndex(0);
      highlightMatch(found[0]);
    } else {
      setCurrentIndex(0);
    }
  }, [editor, searchTerm, isCaseSensitive]);

  // Select and scroll to a match range in TipTap
  const highlightMatch = (range: MatchRange) => {
    if (!editor || !range) return;
    try {
      editor.commands.setTextSelection({ from: range.from, to: range.to });
      editor.commands.scrollIntoView();
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      findMatches();
      setTimeout(() => searchInputRef.current?.select(), 50);
    } else {
      setSearchTerm("");
      setReplaceTerm("");
      setMatches([]);
    }
  }, [isOpen, searchTerm, isCaseSensitive, findMatches]);

  // Navigate to Next match
  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIdx);
    highlightMatch(matches[nextIdx]);
  };

  // Navigate to Previous match
  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIdx);
    highlightMatch(matches[prevIdx]);
  };

  // Replace current active match
  const handleReplace = () => {
    if (matches.length === 0 || !editor) return;
    const current = matches[currentIndex];
    editor.chain().focus().insertContentAt({ from: current.from, to: current.to }, replaceTerm).run();
    // Re-scan after replace
    setTimeout(findMatches, 50);
  };

  // Replace all matches across document
  const handleReplaceAll = () => {
    if (matches.length === 0 || !editor) return;
    
    // Replace from bottom to top so positions don't shift
    const sorted = [...matches].sort((a, b) => b.from - a.from);
    const tr = editor.state.tr;
    sorted.forEach((m) => {
      tr.insertText(replaceTerm, m.from, m.to);
    });
    editor.view.dispatch(tr);
    setTimeout(findMatches, 50);
  };

  // Keyboard shortcut listener inside the bar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-28 right-8 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
      <div
        className={`w-80 sm:w-96 rounded-2xl shadow-2xl border p-3 flex flex-col gap-2 backdrop-blur-md transition-all ${
          isDark
            ? "bg-gray-900/95 border-gray-700/80 text-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            : "bg-white/95 border-gray-200/90 text-gray-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        }`}
      >
        {/* Search Row */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find in document..."
              className={`w-full pl-8 pr-16 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-colors ${
                isDark
                  ? "bg-stone-800 border-stone-700 text-white placeholder-stone-500"
                  : "bg-[#FAF7F2] border-stone-200 text-stone-900 placeholder-stone-400"
              }`}
            />
            {/* Match Counter Badge */}
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-stone-400 select-none">
              {searchTerm
                ? matches.length > 0
                  ? `${currentIndex + 1}/${matches.length}`
                  : "0 found"
                : ""}
            </span>
          </div>

          {/* Navigation & Options */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={matches.length === 0}
              className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer transition-colors text-stone-600 dark:text-stone-300"
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp size={15} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={matches.length === 0}
              className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer transition-colors text-stone-600 dark:text-stone-300"
              title="Next match (Enter)"
            >
              <ChevronDown size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsCaseSensitive(!isCaseSensitive)}
              className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                isCaseSensitive
                  ? "bg-orange-500 text-white shadow-xs"
                  : "hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400"
              }`}
              title="Match case (Aa)"
            >
              <CaseSensitive size={15} />
            </button>
            <button
              type="button"
              onClick={() => setShowReplace(!showReplace)}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                showReplace
                  ? "bg-amber-500 text-white shadow-xs"
                  : "hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400"
              }`}
              title="Toggle Replace"
            >
              <Replace size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer transition-colors"
              title="Close (Esc)"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Replace Row (Expandable) */}
        {showReplace && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-stone-200 dark:border-stone-800 animate-in fade-in duration-100">
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Replace with..."
              className={`flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-colors ${
                isDark
                  ? "bg-stone-800 border-stone-700 text-white placeholder-stone-500"
                  : "bg-[#FAF7F2] border-stone-200 text-stone-900 placeholder-stone-400"
              }`}
            />
            <button
              type="button"
              onClick={handleReplace}
              disabled={matches.length === 0}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={matches.length === 0}
              className="px-2.5 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 disabled:opacity-30 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95"
            >
              All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
