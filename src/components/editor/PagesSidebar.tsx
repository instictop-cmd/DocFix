"use client";
"use no memo";

import { useState, useEffect, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  FileText,
  Plus,
  ChevronLeft,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";

interface PagesSidebarProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export interface PageInfo {
  pageNumber: number;
  title: string;
  wordCount: number;
  snippet: string;
}

export default function PagesSidebar({
  editor,
  isOpen,
  onClose,
  isDark,
}: PagesSidebarProps) {
  const [pages, setPages] = useState<PageInfo[]>([
    { pageNumber: 1, title: "Page 1", wordCount: 0, snippet: "Start typing..." },
  ]);
  const [activePage, setActivePage] = useState(1);

  // Scan editor content for page breaks or split by content
  const updatePages = useCallback(() => {
    if (!editor) return;

    const html = editor.getHTML();
    const text = editor.getText();

    // Check if horizontal rules or page breaks exist
    const rawSections = html.split(/<hr[^>]*>/gi);
    const textSections = text.split(/_{3,}|\-{3,}|\*{3,}/gi);

    const parsedPages: PageInfo[] = rawSections.map((section, idx) => {
      // Strip HTML to get text preview
      const temp = typeof document !== "undefined" ? document.createElement("div") : null;
      let cleanText = "";
      if (temp) {
        temp.innerHTML = section;
        cleanText = temp.textContent || temp.innerText || "";
      } else {
        cleanText = section.replace(/<[^>]*>/g, "");
      }

      // Extract first heading or first few words as title
      const headingMatch = section.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
      let pageTitle = `Page ${idx + 1}`;
      if (headingMatch && headingMatch[1]) {
        const hText = headingMatch[1].replace(/<[^>]*>/g, "").trim();
        if (hText) pageTitle = hText.length > 22 ? `${hText.substring(0, 22)}...` : hText;
      }

      const words = cleanText.trim().split(/\s+/).filter(Boolean).length;
      const snippet = cleanText.trim().substring(0, 45) || "Empty page";

      return {
        pageNumber: idx + 1,
        title: pageTitle,
        wordCount: words,
        snippet: snippet.length >= 45 ? `${snippet}...` : snippet,
      };
    });

    setPages(parsedPages.length > 0 ? parsedPages : [{ pageNumber: 1, title: "Page 1", wordCount: 0, snippet: "Empty page" }]);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    updatePages();
    editor.on("update", updatePages);
    return () => {
      editor.off("update", updatePages);
    };
  }, [editor, updatePages]);

  // Add a new page (inserts a Page Break HR and scrolls to it)
  const handleAddPage = () => {
    if (!editor) return;
    
    // Move cursor to the end, insert horizontal rule as page divider, and add empty paragraph
    editor
      .chain()
      .focus("end")
      .setHorizontalRule()
      .createParagraphNear()
      .run();

    setTimeout(() => {
      updatePages();
      const allHrs = document.querySelectorAll(".tiptap hr");
      if (allHrs.length > 0) {
        const lastHr = allHrs[allHrs.length - 1];
        lastHr.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setActivePage(pages.length + 1);
    }, 100);
  };

  // Scroll to a specific page
  const handleSelectPage = (pageIndex: number) => {
    setActivePage(pageIndex + 1);
    if (!editor) return;

    if (pageIndex === 0) {
      // Top of the document
      const top = document.querySelector(".tiptap");
      top?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Find the corresponding HR divider
      const allHrs = document.querySelectorAll(".tiptap hr");
      const targetHr = allHrs[pageIndex - 1];
      if (targetHr) {
        targetHr.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className={`w-60 sm:w-64 border-r flex flex-col shrink-0 select-none z-20 transition-all duration-200 animate-in slide-in-from-left-4 ${
        isDark
          ? "bg-gray-900/95 border-gray-800 text-gray-200"
          : "bg-white/95 border-gray-200 text-gray-800"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3.5 py-3 border-b ${
          isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50/80"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Layers size={13} />
          </div>
          <span className="font-bold text-xs tracking-tight">
            Pages ({pages.length})
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer transition-colors"
          title="Collapse Pages sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Page Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {pages.map((page, index) => {
          const isActive = activePage === page.pageNumber;
          return (
            <div
              key={page.pageNumber}
              onClick={() => handleSelectPage(index)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer group relative ${
                isActive
                  ? isDark
                    ? "bg-blue-950/30 border-blue-500/60 ring-2 ring-blue-500/20 shadow-sm"
                    : "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/20 shadow-xs"
                  : isDark
                    ? "bg-gray-800/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/70"
                    : "bg-gray-50/60 border-gray-200/80 hover:border-gray-300 hover:bg-white"
              }`}
            >
              {/* Top Row: Page number & words */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isDark
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Page {page.pageNumber}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {page.wordCount} words
                </span>
              </div>

              {/* Title & Snippet Preview */}
              <h4 className="text-xs font-bold truncate text-gray-900 dark:text-gray-100 mb-0.5">
                {page.title}
              </h4>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-2 leading-snug">
                {page.snippet}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions: Add Page Button */}
      <div
        className={`p-3 border-t ${
          isDark ? "border-gray-800 bg-gray-900/60" : "border-gray-200 bg-gray-50/50"
        }`}
      >
        <button
          type="button"
          onClick={handleAddPage}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus size={14} />
          <span>Add New Page</span>
        </button>
      </div>
    </aside>
  );
}
