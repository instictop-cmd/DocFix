"use client";
"use no memo";

import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Code,
  RemoveFormatting,
  Download,
  Moon,
  Sun,
  Lock,
  Maximize2,
  Minimize2,
  FileDown,
  Image as ImageIcon,
  History,
  MessageSquare,
  Sparkles,
  CheckSquare,
  Table as TableIcon,
  Vote,
  PlusSquare,
  Trash2,
  Search,
  Highlighter as HighlighterIcon,
  Baseline,
  FileText,
  Layers,
} from "lucide-react";
import { useState } from "react";
import ImageModal from "./ImageModal";

import {
  exportPagesAsMarkdown,
  exportPagesAsHTML,
  printSpecificPages,
  getDocumentPages,
  parsePageRange,
} from "../../lib/pageExportUtils";

interface ToolbarProps {
  editor: Editor;
  isDark: boolean;
  onToggleDark: () => void;
  isReadOnly?: boolean;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  documentTitle: string;
  onOpenHistory?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onOpenDocPilot?: () => void;
  onOpenPolls?: () => void;
  isPaginated?: boolean;
  onTogglePaginated?: () => void;
  onOpenFindReplace?: () => void;
  isPagesOpen?: boolean;
  onTogglePages?: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
  isDark?: boolean;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
  isDark = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer active:scale-90 select-none ${
        isActive
          ? isDark
            ? "bg-gray-700 text-blue-400 shadow-xs font-semibold"
            : "bg-white text-blue-600 shadow-xs font-semibold"
          : isDark
            ? "text-gray-400 hover:text-gray-100 hover:bg-gray-700/50"
            : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

export default function Toolbar({
  editor,
  isDark,
  onToggleDark,
  isReadOnly = false,
  isZenMode = false,
  onToggleZenMode,
  documentTitle,
  onOpenHistory,
  onToggleChat,
  isChatOpen = false,
  onOpenDocPilot,
  onOpenPolls,
  isPaginated = false,
  onTogglePaginated,
  onOpenFindReplace,
  isPagesOpen = false,
  onTogglePages,
}: ToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [exportRangeInput, setExportRangeInput] = useState("all");

  // Text colors palette
  const TEXT_COLORS = [
    { name: "Default", color: "inherit" },
    { name: "Slate", color: "#475569" },
    { name: "Blue", color: "#2563eb" },
    { name: "Emerald", color: "#059669" },
    { name: "Red", color: "#dc2626" },
    { name: "Amber", color: "#d97706" },
    { name: "Purple", color: "#7c3aed" },
    { name: "Pink", color: "#db2777" },
  ];

  // Highlighter pastel markers
  const HIGHLIGHT_COLORS = [
    { name: "Yellow", color: "#fef08a", border: "#fde047" },
    { name: "Green", color: "#bbf7d0", border: "#86efac" },
    { name: "Cyan", color: "#bae6fd", border: "#7dd3fc" },
    { name: "Lavender", color: "#e9d5ff", border: "#d8b4fe" },
    { name: "Pink", color: "#fbcfe8", border: "#f472b6" },
    { name: "Peach", color: "#fed7aa", border: "#fdba74" },
  ];

  // Insert image handler
  const handleInsertImage = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run();
  };

  // Export handlers supporting full doc or specific page ranges
  const handleExport = (format: "md" | "html" | "pdf") => {
    const totalPages = getDocumentPages(editor).length;
    const targetPages = parsePageRange(exportRangeInput, totalPages);

    if (format === "md") {
      exportPagesAsMarkdown(editor, targetPages, documentTitle);
    } else if (format === "html") {
      exportPagesAsHTML(editor, targetPages, documentTitle);
    } else if (format === "pdf") {
      printSpecificPages(editor, targetPages, documentTitle);
    }
    setShowExportMenu(false);
  };

  const pillContainerClass = isDark
    ? "flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-800/80 border border-gray-700/60"
    : "flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-100/90 border border-gray-200/70";

  if (isReadOnly) {
    return (
      <div
        className={`flex items-center justify-between px-4 py-2 border-b text-xs font-medium ${
          isDark
            ? "bg-gray-900 border-gray-800 text-amber-400"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}
      >
        <div className="flex items-center gap-2">
          <Lock size={14} />
          <span>You are viewing this document in <strong>Read-Only Mode</strong> (Viewer).</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenFindReplace && (
            <button
              type="button"
              onClick={onOpenFindReplace}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-amber-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer text-xs font-semibold transition-all active:scale-95"
            >
              <Search size={13} />
              <span>Find</span>
            </button>
          )}
          {onOpenPolls && (
            <button
              type="button"
              onClick={onOpenPolls}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-amber-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer text-xs font-semibold transition-all active:scale-95"
            >
              <Vote size={13} />
              <span>Polls</span>
            </button>
          )}
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-amber-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer text-xs font-semibold transition-all active:scale-95"
            >
              <History size={13} />
              <span>History</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleDark}
            className="p-1.5 rounded-md hover:bg-amber-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer transition-all active:scale-95"
            title="Toggle theme"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex items-center justify-between px-3.5 py-2 border-b transition-colors flex-wrap gap-2 ${
          isDark
            ? "bg-gray-900/95 border-gray-800/80 text-gray-200"
            : "bg-white border-gray-200/80 text-gray-800"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* AI Group: DocPilot */}
          {onOpenDocPilot && (
            <button
              type="button"
              onClick={onOpenDocPilot}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white text-xs font-semibold transition-all shadow-xs hover:shadow-purple-500/20 hover:shadow-md active:scale-95 cursor-pointer"
              title="DocPilot AI Copilot (Cmd+J)"
            >
              <Sparkles size={13} className="animate-pulse text-purple-200" />
              <span>DocPilot</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-semibold bg-white/20 rounded text-white tracking-wider">
                ⌘J
              </kbd>
            </button>
          )}

          {/* Group 1: Undo & Redo */}
          <div className={pillContainerClass}>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
              isDark={isDark}
            >
              <Undo2 size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
              isDark={isDark}
            >
              <Redo2 size={15} />
            </ToolbarButton>
          </div>

          {/* Group 2: Typography Marks & Color/Highlighter */}
          <div className={pillContainerClass}>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold (Ctrl+B)"
              isDark={isDark}
            >
              <Bold size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
              isDark={isDark}
            >
              <Italic size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="Underline (Ctrl+U)"
              isDark={isDark}
            >
              <UnderlineIcon size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough"
              isDark={isDark}
            >
              <Strikethrough size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive("code")}
              title="Inline Code"
              isDark={isDark}
            >
              <Code size={15} />
            </ToolbarButton>

            {/* Text Color Picker Dropdown */}
            <div className="relative">
              <ToolbarButton
                onClick={() => {
                  setShowColorMenu(!showColorMenu);
                  setShowHighlightMenu(false);
                }}
                isActive={showColorMenu}
                title="Text Color"
                isDark={isDark}
              >
                <div className="flex flex-col items-center justify-center">
                  <Baseline size={13} />
                  <div
                    className="w-3 h-0.5 rounded-full mt-0.5"
                    style={{
                      backgroundColor:
                        editor.getAttributes("textStyle").color ||
                        (isDark ? "#93C5FD" : "#2563EB"),
                    }}
                  />
                </div>
              </ToolbarButton>

              {showColorMenu && (
                <div
                  className={`absolute left-0 mt-1.5 p-2 rounded-xl shadow-2xl border z-50 text-xs animate-in fade-in zoom-in-95 duration-100 grid grid-cols-4 gap-1.5 w-36 ${
                    isDark
                      ? "bg-gray-900 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        if (c.color === "inherit") {
                          editor.chain().focus().unsetColor().run();
                        } else {
                          editor.chain().focus().setColor(c.color).run();
                        }
                        setShowColorMenu(false);
                      }}
                      className="w-6 h-6 rounded-md flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform cursor-pointer shadow-2xs"
                      style={{ backgroundColor: c.color === "inherit" ? (isDark ? "#374151" : "#F3F4F6") : c.color }}
                      title={c.name}
                    >
                      {c.color === "inherit" && <span className="text-[9px] font-bold text-gray-400">✕</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Highlighter Pen Dropdown */}
            <div className="relative">
              <ToolbarButton
                onClick={() => {
                  setShowHighlightMenu(!showHighlightMenu);
                  setShowColorMenu(false);
                }}
                isActive={editor.isActive("highlight") || showHighlightMenu}
                title="Highlight Marker"
                isDark={isDark}
              >
                <HighlighterIcon size={14} />
              </ToolbarButton>

              {showHighlightMenu && (
                <div
                  className={`absolute left-0 mt-1.5 p-2 rounded-xl shadow-2xl border z-50 text-xs animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1.5 w-36 ${
                    isDark
                      ? "bg-gray-900 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="grid grid-cols-3 gap-1.5">
                    {HIGHLIGHT_COLORS.map((h) => (
                      <button
                        key={h.name}
                        type="button"
                        onClick={() => {
                          editor.chain().focus().toggleHighlight({ color: h.color }).run();
                          setShowHighlightMenu(false);
                        }}
                        className="w-8 h-6 rounded-md border hover:scale-105 transition-transform cursor-pointer shadow-2xs"
                        style={{ backgroundColor: h.color, borderColor: h.border }}
                        title={h.name}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().unsetHighlight().run();
                      setShowHighlightMenu(false);
                    }}
                    className="w-full py-1 text-[10px] font-semibold text-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-500 transition-colors cursor-pointer border border-dashed border-gray-200 dark:border-gray-700"
                  >
                    Clear Highlight
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Group 3: Headings */}
          <div className={pillContainerClass}>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
              isDark={isDark}
            >
              <Heading1 size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
              isDark={isDark}
            >
              <Heading2 size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
              isDark={isDark}
            >
              <Heading3 size={15} />
            </ToolbarButton>
          </div>

          {/* Group 4: Lists & Blocks */}
          <div className={pillContainerClass}>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
              isDark={isDark}
            >
              <List size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered List"
              isDark={isDark}
            >
              <ListOrdered size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive("taskList")}
              title="Interactive Task Checklist (To-Do)"
              isDark={isDark}
            >
              <CheckSquare size={15} />
            </ToolbarButton>

            {/* Tables Menu */}
            <div className="relative">
              <ToolbarButton
                onClick={() => setShowTableMenu(!showTableMenu)}
                isActive={editor.isActive("table")}
                title="Collaborative Grid Tables"
                isDark={isDark}
              >
                <TableIcon size={15} />
              </ToolbarButton>

              {showTableMenu && (
                <div
                  className={`absolute left-0 mt-1.5 w-48 rounded-xl shadow-2xl border p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? "bg-gray-900 border-gray-700 text-gray-200"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      editor
                        .chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run();
                      setShowTableMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <PlusSquare size={13} /> Insert 3x3 Table
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().addRowAfter().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().addRowAfter()}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white disabled:opacity-30 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    ➕ Add Row Below
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().addColumnAfter().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().addColumnAfter()}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white disabled:opacity-30 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    ➕ Add Column Right
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteRow().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().deleteRow()}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-red-600 hover:text-white disabled:opacity-30 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    ➖ Delete Row
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteColumn().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().deleteColumn()}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-red-600 hover:text-white disabled:opacity-30 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    ➖ Delete Column
                  </button>
                  <div className="border-t my-1 border-gray-200 dark:border-gray-800" />
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteTable().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().deleteTable()}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-red-600 hover:text-white text-red-500 disabled:opacity-30 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <Trash2 size={13} /> Delete Table
                  </button>
                </div>
              )}
            </div>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="Blockquote Callout"
              isDark={isDark}
            >
              <Quote size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Divider"
              isDark={isDark}
            >
              <Minus size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setIsImageModalOpen(true)}
              isActive={editor.isActive("image")}
              title="Insert Image (Upload file, paste, or presets)"
              isDark={isDark}
            >
              <ImageIcon size={15} />
            </ToolbarButton>
          </div>

          {/* Group 5: Clear Formatting */}
          <div className={pillContainerClass}>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
              title="Clear Formatting"
              isDark={isDark}
            >
              <RemoveFormatting size={15} />
            </ToolbarButton>
          </div>
        </div>

        {/* Right side actions: Find, View Mode, Polls, History, Chat, Export, Zen, Dark */}
        <div className="flex items-center gap-2">
          {/* Find & Replace & View Mode Pill */}
          <div className={pillContainerClass}>
            {/* Pages Thumbnail Sidebar Toggle */}
            {onTogglePages && (
              <button
                type="button"
                onClick={onTogglePages}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer active:scale-95 ${
                  isPagesOpen
                    ? isDark
                      ? "bg-gray-700 text-blue-400 shadow-xs"
                      : "bg-white text-blue-600 shadow-xs"
                    : isDark
                      ? "text-gray-400 hover:text-gray-100 hover:bg-gray-700/60"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }`}
                title="Toggle Left Pages Panel (Thumbnails & Add Page)"
              >
                <Layers size={13} />
                <span className="hidden xl:inline">Pages</span>
              </button>
            )}

            {/* Find & Replace */}
            {onOpenFindReplace && (
              <button
                type="button"
                onClick={onOpenFindReplace}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer active:scale-95 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-gray-700"
                title="Find & Replace (Cmd+F / Ctrl+F)"
              >
                <Search size={13} />
                <span className="hidden xl:inline">Find</span>
                <kbd className="hidden 2xl:inline-block px-1 py-0.2 text-[8px] font-semibold bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                  ⌘F
                </kbd>
              </button>
            )}

            {/* Pageless vs Paginated Toggle */}
            {onTogglePaginated && (
              <button
                type="button"
                onClick={onTogglePaginated}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer active:scale-95 ${
                  isPaginated
                    ? isDark
                      ? "bg-gray-700 text-purple-300 shadow-xs"
                      : "bg-white text-purple-700 shadow-xs"
                    : isDark
                      ? "text-gray-400 hover:text-gray-100 hover:bg-gray-700/60"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }`}
                title={isPaginated ? "Switch to Pageless continuous view" : "Switch to A4 Paginated sheets"}
              >
                {isPaginated ? <FileText size={13} /> : <FileText size={13} className="opacity-60" />}
                <span className="hidden xl:inline">{isPaginated ? "A4" : "Pageless"}</span>
              </button>
            )}
          </div>

          {/* Action Pills */}
          <div className={pillContainerClass}>
            {/* Collaborative Polls */}
            {onOpenPolls && (
              <button
                type="button"
                onClick={onOpenPolls}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer active:scale-95 text-amber-600 dark:text-amber-400 hover:bg-white dark:hover:bg-gray-700"
                title="Real-Time Collaborative Polls"
              >
                <Vote size={14} />
                <span className="hidden md:inline">Polls</span>
              </button>
            )}

            {/* Version History */}
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer active:scale-95 text-purple-600 dark:text-purple-300 hover:bg-white dark:hover:bg-gray-700"
                title="View Version History & Snapshots"
              >
                <History size={14} />
                <span className="hidden md:inline">History</span>
              </button>
            )}

            {/* Live Team Chat */}
            {onToggleChat && (
              <button
                type="button"
                onClick={onToggleChat}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer active:scale-95 ${
                  isChatOpen
                    ? isDark
                      ? "bg-gray-700 text-blue-400 shadow-xs"
                      : "bg-white text-blue-600 shadow-xs"
                    : isDark
                      ? "text-gray-300 hover:bg-gray-700/60 hover:text-white"
                      : "text-gray-700 hover:bg-white hover:text-gray-900"
                }`}
                title="Toggle Live Team Chat"
              >
                <MessageSquare size={14} />
                <span className="hidden md:inline">Chat</span>
              </button>
            )}
          </div>

          {/* Export & Controls Pill */}
          <div className={pillContainerClass}>
            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="w-7.5 h-7.5 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer active:scale-90 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
                title="Export Document (Markdown, HTML, PDF)"
              >
                <Download size={14} />
              </button>

              {showExportMenu && (
                <div
                  className={`absolute right-0 mt-1.5 w-52 rounded-xl shadow-xl border p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? "bg-gray-900 border-gray-700 text-gray-200"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  <div className="mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-800">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Pages to Export
                    </label>
                    <input
                      type="text"
                      value={exportRangeInput}
                      onChange={(e) => setExportRangeInput(e.target.value)}
                      placeholder='e.g. "all", "1", "1-2"'
                      className={`w-full px-2 py-1 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        isDark
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      }`}
                    />
                    <span className="text-[9px] text-gray-400 mt-0.5 block">
                      Type <strong>all</strong>, or <strong>1</strong>, <strong>1-3</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExport("md")}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileDown size={13} /> Markdown (.md)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("html")}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileDown size={13} /> HTML (.html)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("pdf")}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileDown size={13} /> Print / Save as PDF
                  </button>
                </div>
              )}
            </div>

            {/* Zen Focus Mode */}
            {onToggleZenMode && (
              <button
                type="button"
                onClick={onToggleZenMode}
                className="w-7.5 h-7.5 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer active:scale-90 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
                title={isZenMode ? "Exit Zen Mode" : "Focus / Zen Mode"}
              >
                {isZenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDark}
              className="w-7.5 h-7.5 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer active:scale-90 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Supercharged Image Insertion Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsertImage={handleInsertImage}
        isDark={isDark}
      />
    </>
  );
}
