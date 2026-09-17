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
      className={`p-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
        isActive
          ? isDark
            ? "bg-blue-900/60 text-blue-300 font-semibold"
            : "bg-blue-100 text-blue-700 font-semibold"
          : isDark
            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

function Divider({ isDark = false }: { isDark?: boolean }) {
  return (
    <div
      className={`w-px h-5 mx-1 ${
        isDark ? "bg-gray-700" : "bg-gray-200"
      }`}
    />
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
}: ToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
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

  if (isReadOnly) {
    return (
      <div
        className={`flex items-center justify-between px-4 py-2 border-b text-xs font-medium ${
          isDark
            ? "bg-gray-900 border-gray-800 text-amber-400"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Lock size={14} />
          <span>You are viewing this document in <strong>Read-Only Mode</strong> (Viewer).</span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-amber-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer text-xs"
            >
              <History size={14} />
              <span>History</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleDark}
            className="p-1 rounded hover:bg-amber-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
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
        className={`flex items-center justify-between px-3 py-1.5 border-b transition-colors flex-wrap gap-y-1 ${
          isDark
            ? "bg-gray-900 border-gray-800 text-gray-200"
            : "bg-gray-50 border-gray-200 text-gray-800"
        }`}
      >
        <div className="flex items-center gap-0.5 flex-wrap">
          {/* DocPilot AI Assistant Button */}
          {onOpenDocPilot && (
            <>
              <button
                type="button"
                onClick={onOpenDocPilot}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer mr-1"
                title="DocPilot AI (Summarize, Polish, Continue Writing)"
              >
                <Sparkles size={13} className="animate-pulse" />
                <span>DocPilot</span>
              </button>
              <Divider isDark={isDark} />
            </>
          )}

          {/* Undo / Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
            isDark={isDark}
          >
            <Undo2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
            isDark={isDark}
          >
            <Redo2 size={16} />
          </ToolbarButton>

          <Divider isDark={isDark} />

          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
            isDark={isDark}
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic (Ctrl+I)"
            isDark={isDark}
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline (Ctrl+U)"
            isDark={isDark}
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
            isDark={isDark}
          >
            <Strikethrough size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Inline Code"
            isDark={isDark}
          >
            <Code size={16} />
          </ToolbarButton>

          <Divider isDark={isDark} />

          {/* Headings */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
            isDark={isDark}
          >
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
            isDark={isDark}
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
            isDark={isDark}
          >
            <Heading3 size={16} />
          </ToolbarButton>

          <Divider isDark={isDark} />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
            isDark={isDark}
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
            isDark={isDark}
          >
            <ListOrdered size={16} />
          </ToolbarButton>

          <Divider isDark={isDark} />

          {/* Block elements */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Blockquote"
            isDark={isDark}
          >
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
            isDark={isDark}
          >
            <Minus size={16} />
          </ToolbarButton>

          {/* Supercharged Insert Image (File Upload + URL + Presets) */}
          <ToolbarButton
            onClick={() => setIsImageModalOpen(true)}
            isActive={editor.isActive("image")}
            title="Insert Image (Upload file, paste link, or presets)"
            isDark={isDark}
          >
            <ImageIcon size={16} />
          </ToolbarButton>

          <Divider isDark={isDark} />

          {/* Clear formatting */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
            title="Clear Formatting"
            isDark={isDark}
          >
            <RemoveFormatting size={16} />
          </ToolbarButton>
        </div>

        {/* Right side actions: History, Chat, Zen Mode, Dark Mode, Export */}
        <div className="flex items-center gap-1">
          {/* Version History Button */}
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-colors cursor-pointer ${
                isDark
                  ? "text-purple-300 hover:bg-purple-900/40"
                  : "text-purple-700 hover:bg-purple-100/70"
              }`}
              title="View Version History & Snapshots"
            >
              <History size={14} />
              <span className="hidden sm:inline">History</span>
            </button>
          )}

          {/* Live Team Chat Button */}
          {onToggleChat && (
            <button
              type="button"
              onClick={onToggleChat}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-colors cursor-pointer ${
                isChatOpen
                  ? isDark
                    ? "bg-blue-900/60 text-blue-300"
                    : "bg-blue-100 text-blue-700"
                  : isDark
                    ? "text-gray-300 hover:bg-gray-800"
                    : "text-gray-700 hover:bg-gray-100"
              }`}
              title="Toggle Live Team Chat"
            >
              <MessageSquare size={14} />
              <span className="hidden sm:inline">Chat</span>
            </button>
          )}

          <Divider isDark={isDark} />

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                isDark
                  ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-xs"
              }`}
              title="Export Document"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>

            {showExportMenu && (
              <div
                className={`absolute right-0 mt-1 w-44 rounded-lg shadow-xl border py-1 z-50 text-xs ${
                  isDark
                    ? "bg-gray-900 border-gray-700 text-gray-200"
                    : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                <button
                  type="button"
                  onClick={exportAsMarkdown}
                  className="w-full px-3 py-2 text-left hover:bg-blue-500 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <FileDown size={14} /> Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={exportAsHTML}
                  className="w-full px-3 py-2 text-left hover:bg-blue-500 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <FileDown size={14} /> HTML (.html)
                </button>
                <button
                  type="button"
                  onClick={exportAsPDF}
                  className="w-full px-3 py-2 text-left hover:bg-blue-500 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <FileDown size={14} /> Print / Save as PDF
                </button>
              </div>
            )}
          </div>

          {/* Zen Focus Mode */}
          {onToggleZenMode && (
            <button
              type="button"
              onClick={onToggleZenMode}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isDark
                  ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              title={isZenMode ? "Exit Zen Mode" : "Focus / Zen Mode"}
            >
              {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDark}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isDark
                ? "text-yellow-400 hover:bg-gray-800"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
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
