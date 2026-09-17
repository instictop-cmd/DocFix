"use client";
"use no memo";

import { useState, useRef } from "react";
import { X, Upload, Link2, Image as ImageIcon, Sparkles, Check } from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (url: string) => void;
  isDark?: boolean;
}

const PRESET_IMAGES = [
  {
    name: "Modern Workspace",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Minimalist Desk",
    url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Coding / Tech",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Creative Studio",
    url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80",
  },
];

export default function ImageModal({
  isOpen,
  onClose,
  onInsertImage,
  isDark = false,
}: ImageModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "presets">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, SVG, WebP, GIF).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmInsert = () => {
    const finalUrl = activeTab === "url" ? urlInput.trim() : previewUrl;
    if (finalUrl) {
      onInsertImage(finalUrl);
      onClose();
      // Reset state
      setUrlInput("");
      setPreviewUrl(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl shadow-2xl p-6 max-w-lg w-full border transition-all animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? "bg-gray-900 border-gray-800 text-gray-100"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                Insert Image
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload from device, paste web URL, or choose preset
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

        {/* Tab Navigation */}
        <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-gray-800 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            <Upload size={13} />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "url"
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            <Link2 size={13} />
            Image URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "presets"
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            <Sparkles size={13} />
            Presets
          </button>
        </div>

        {/* Tab 1: Upload from Computer */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : isDark
                    ? "border-gray-700 bg-gray-800/40 hover:bg-gray-800 hover:border-gray-600"
                    : "border-gray-300 bg-gray-50/70 hover:bg-gray-100/70 hover:border-blue-400"
              }`}
            >
              {previewUrl ? (
                <div className="relative w-full max-h-48 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-44 object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-semibold px-3 py-1.5 bg-blue-600 rounded-lg shadow-md">
                      Click to choose another image
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-1">
                    <Upload size={22} />
                  </div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Click to browse or drag & drop image here
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Supports PNG, JPG, GIF, WebP, SVG (Auto-compressed)
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Web URL */}
        {activeTab === "url" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Paste Image Link
              </label>
              <div className="relative">
                <Link2
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setPreviewUrl(e.target.value);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                  }`}
                />
              </div>
            </div>

            {urlInput && (
              <div className="p-2 border rounded-xl bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                  Live Preview:
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urlInput}
                  alt="URL Preview"
                  className="w-full h-36 object-contain rounded-lg bg-black/10"
                  onError={() => {}}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Presets */}
        {activeTab === "presets" && (
          <div className="grid grid-cols-2 gap-3">
            {PRESET_IMAGES.map((preset) => {
              const isSelected = previewUrl === preset.url;
              return (
                <div
                  key={preset.name}
                  onClick={() => {
                    setPreviewUrl(preset.url);
                    setUrlInput(preset.url);
                  }}
                  className={`border rounded-xl p-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/30 dark:bg-blue-900/20"
                      : isDark
                        ? "border-gray-800 hover:border-gray-700 bg-gray-800/40"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-20 object-cover rounded-lg mb-1.5"
                  />
                  <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {preset.name}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewUrl && !urlInput.trim()}
            onClick={handleConfirmInsert}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              previewUrl || urlInput.trim()
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Check size={14} />
            <span>Insert Image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
