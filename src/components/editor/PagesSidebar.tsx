"use client";
"use no memo";

import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
  FileText,
  Plus,
  ChevronLeft,
  Trash2,
  Layers,
  MoreVertical,
  Download,
  Copy,
  Edit2,
  Eraser,
  Printer,
  FileDown,
} from "lucide-react";
import {
  exportPagesAsMarkdown,
  exportPagesAsHTML,
  printSpecificPages,
} from "../../lib/pageExportUtils";

interface PagesSidebarProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  documentTitle?: string;
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
  documentTitle = "Untitled Document",
}: PagesSidebarProps) {
  const [pages, setPages] = useState<PageInfo[]>([
    { pageNumber: 1, title: "Page 1", wordCount: 0, snippet: "Start typing..." },
  ]);
  const [activePage, setActivePage] = useState(1);
  const [menuOpenPage, setMenuOpenPage] = useState<number | null>(null);
  const [renamingPage, setRenamingPage] = useState<number | null>(null);
  const [customTitles, setCustomTitles] = useState<{ [page: number]: string }>({});

  const menuRef = useRef<HTMLDivElement>(null);

  // Close 3-dot dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenPage(null);
      }
    };
    if (menuOpenPage !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpenPage]);

  // Scan editor content for page breaks or split by content
  const updatePages = useCallback(() => {
    if (!editor) return;

    const html = editor.getHTML();
    const rawSections = html.split(/<hr[^>]*>/gi);

    const parsedPages: PageInfo[] = rawSections.map((section, idx) => {
      const temp = typeof document !== "undefined" ? document.createElement("div") : null;
      let cleanText = "";
      if (temp) {
        temp.innerHTML = section;
        cleanText = temp.textContent || temp.innerText || "";
      } else {
        cleanText = section.replace(/<[^>]*>/g, "");
      }

      // Check custom overridden title or extract heading
      let pageTitle = customTitles[idx + 1];
      if (!pageTitle) {
        const headingMatch = section.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
        pageTitle = `Page ${idx + 1}`;
        if (headingMatch && headingMatch[1]) {
          const hText = headingMatch[1].replace(/<[^>]*>/g, "").trim();
          if (hText) pageTitle = hText.length > 20 ? `${hText.substring(0, 20)}...` : hText;
        }
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
  }, [editor, customTitles]);

  useEffect(() => {
    if (!editor) return;
    updatePages();
    editor.on("update", updatePages);
    return () => {
      editor.off("update", updatePages);
    };
  }, [editor, updatePages]);

  // Add a new page
  const handleAddPage = () => {
    if (!editor) return;
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
      const top = document.querySelector(".tiptap");
      top?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      const allHrs = document.querySelectorAll(".tiptap hr");
      const targetHr = allHrs[pageIndex - 1];
      if (targetHr) {
        targetHr.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // 1. DELETE PAGE
  const handleDeletePage = (pageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenPage(null);
    if (!editor) return;

    const html = editor.getHTML();
    const rawSections = html.split(/<hr[^>]*>/gi);

    if (rawSections.length <= 1) {
      // Only 1 page: clear its content
      editor.commands.setContent("<p></p>");
    } else {
      // Remove section at pageIndex
      rawSections.splice(pageIndex, 1);
      const newHtml = rawSections.join("<hr />");
      editor.commands.setContent(newHtml);
    }

    setTimeout(updatePages, 50);
  };

  // 2. DUPLICATE PAGE
  const handleDuplicatePage = (pageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenPage(null);
    if (!editor) return;

    const html = editor.getHTML();
    const rawSections = html.split(/<hr[^>]*>/gi);
    const targetSection = rawSections[pageIndex] || "<p></p>";

    // Insert copy directly after
    rawSections.splice(pageIndex + 1, 0, targetSection);
    const newHtml = rawSections.join("<hr />");
    editor.commands.setContent(newHtml);

    setTimeout(updatePages, 50);
  };

  // 3. CLEAR PAGE CONTENT
  const handleClearPage = (pageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenPage(null);
    if (!editor) return;

    const html = editor.getHTML();
    const rawSections = html.split(/<hr[^>]*>/gi);
    rawSections[pageIndex] = "<p></p>";
    const newHtml = rawSections.join("<hr />");
    editor.commands.setContent(newHtml);

    setTimeout(updatePages, 50);
  };

  // 4. DOWNLOAD SPECIFIC PAGE
  const handleExportPage = (
    pageIndex: number,
    format: "pdf" | "md" | "html",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setMenuOpenPage(null);
    if (!editor) return;

    const pageNum = pageIndex + 1;
    if (format === "pdf") {
      printSpecificPages(editor, [pageNum], documentTitle);
    } else if (format === "md") {
      exportPagesAsMarkdown(editor, [pageNum], documentTitle);
    } else if (format === "html") {
      exportPagesAsHTML(editor, [pageNum], documentTitle);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className={`w-64 sm:w-72 border-r flex flex-col shrink-0 select-none z-20 transition-all duration-200 animate-in slide-in-from-left-4 ${
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
          const isMenuOpen = menuOpenPage === page.pageNumber;

          return (
            <div
              key={page.pageNumber}
              onClick={() => handleSelectPage(index)}
              className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                isActive
                  ? isDark
                    ? "bg-blue-950/30 border-blue-500/60 ring-2 ring-blue-500/20 shadow-sm"
                    : "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/20 shadow-xs"
                  : isDark
                    ? "bg-gray-800/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/70"
                    : "bg-gray-50/60 border-gray-200/80 hover:border-gray-300 hover:bg-white"
              }`}
            >
              {/* Top Row: Page badge, word count, 3-dot button */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
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

                {/* 3-Dot Options Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenPage(isMenuOpen ? null : page.pageNumber);
                    }}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
                    title="Page actions"
                  >
                    <MoreVertical size={13} />
                  </button>

                  {/* 3-Dot Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className={`absolute right-0 top-6 w-48 rounded-xl shadow-2xl border p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 ${
                        isDark
                          ? "bg-gray-900 border-gray-700 text-gray-200"
                          : "bg-white border-gray-200 text-gray-700"
                      }`}
                    >
                      {/* Download Submenu */}
                      <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        Download Page {page.pageNumber}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleExportPage(index, "pdf", e)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Printer size={12} /> Save as PDF
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleExportPage(index, "md", e)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileDown size={12} /> Markdown (.md)
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleExportPage(index, "html", e)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileDown size={12} /> HTML (.html)
                      </button>

                      <div className="border-t my-1 border-gray-200 dark:border-gray-800" />

                      {/* Management Actions */}
                      <button
                        type="button"
                        onClick={(e) => handleDuplicatePage(index, e)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Copy size={12} /> Duplicate Page
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingPage(page.pageNumber);
                          setMenuOpenPage(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Edit2 size={12} /> Rename Title
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleClearPage(index, e)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-amber-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Eraser size={12} /> Clear Content
                      </button>

                      <div className="border-t my-1 border-gray-200 dark:border-gray-800" />

                      {/* Delete Page */}
                      <button
                        type="button"
                        onClick={(e) => handleDeletePage(index, e)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-red-600 hover:text-white text-red-500 font-medium flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Trash2 size={12} /> Delete Page
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title Input or Text */}
              {renamingPage === page.pageNumber ? (
                <input
                  type="text"
                  defaultValue={page.title}
                  autoFocus
                  onBlur={(e) => {
                    setCustomTitles((prev) => ({ ...prev, [page.pageNumber]: e.target.value }));
                    setRenamingPage(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setCustomTitles((prev) => ({ ...prev, [page.pageNumber]: (e.target as HTMLInputElement).value }));
                      setRenamingPage(null);
                    } else if (e.key === "Escape") {
                      setRenamingPage(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 text-xs rounded border bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <h4 className="text-xs font-bold truncate text-gray-900 dark:text-gray-100 mb-0.5">
                  {page.title}
                </h4>
              )}

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
