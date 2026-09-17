"use client";
"use no memo";

import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Sparkles, Check } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"upload" | "presets">("upload");
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
    if (previewUrl) {
      onInsertImage(previewUrl);
      onClose();
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 leading-tight">
                Insert Image
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Upload from device or choose a preset photo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl p-1 bg-stone-100 dark:bg-stone-800 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
            }`}
          >
            <Upload size={13} />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "presets"
                ? "bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
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
                  ? "border-orange-500 bg-orange-500/10"
                  : isDark
                    ? "border-stone-700 bg-stone-800/40 hover:bg-stone-800 hover:border-stone-600"
                    : "border-stone-300 bg-[#FAF7F2] hover:bg-stone-100/70 hover:border-orange-400"
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
                  <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-semibold px-3 py-1.5 bg-orange-500 rounded-lg shadow-md">
                      Click to choose another image
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center mb-1">
                    <Upload size={22} />
                  </div>
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Click to browse or drag & drop image here
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Supports PNG, JPG, GIF, WebP, SVG (Auto-compressed)
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Presets */}
        {activeTab === "presets" && (
          <div className="grid grid-cols-2 gap-3">
            {PRESET_IMAGES.map((preset) => {
              const isSelected = previewUrl === preset.url;
              return (
                <div
                  key={preset.name}
                  onClick={() => {
                    setPreviewUrl(preset.url);
                  }}
                  className={`border rounded-xl p-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/30 dark:bg-orange-950/20"
                      : isDark
                        ? "border-stone-800 hover:border-stone-700 bg-stone-800/40"
                        : "border-stone-200 hover:border-orange-300 bg-[#FAF7F2]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-20 object-cover rounded-lg mb-1.5"
                  />
                  <p className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 truncate">
                    {preset.name}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewUrl}
            onClick={handleConfirmInsert}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              previewUrl
                ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
                : "bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed"
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
