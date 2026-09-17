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
} from "lucide-react";
import { useState } from "react";
import ImageModal from "./ImageModal";

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
}: ToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Insert image handler
  const handleInsertImage = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run();
  };

  // Export handlers
  const exportAsMarkdown = () => {
    const text = editor.getText();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle || "document"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportAsHTML = () => {
    const html = editor.getHTML();
    const fullHTML = `<!DOCTYPE html><html><head><title>${documentTitle}</title></head><body>${html}</body></html>`;
    const blob = new Blob([fullHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportAsPDF = () => {
    window.print();
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

          {/* Group 2: Typography Marks */}
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

        {/* Right side actions: Polls, History, Chat, Export, Zen Mode, Dark Mode */}
        <div className="flex items-center gap-2">
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
                  className={`absolute right-0 mt-1.5 w-44 rounded-xl shadow-xl border p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? "bg-gray-900 border-gray-700 text-gray-200"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={exportAsMarkdown}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileDown size={13} /> Markdown (.md)
                  </button>
                  <button
                    type="button"
                    onClick={exportAsHTML}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileDown size={13} /> HTML (.html)
                  </button>
                  <button
                    type="button"
                    onClick={exportAsPDF}
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
