"use client";
"use no memo";

import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";

interface SaveToastProps {
  message: string;
  type: "auto" | "manual";
  isVisible: boolean;
  onDismiss: () => void;
}

export default function SaveToast({ message, type, isVisible, onDismiss }: SaveToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onDismiss, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-sm ${
          type === "manual"
            ? "bg-blue-600/90 border-blue-500/50 text-white"
            : "bg-emerald-600/90 border-emerald-500/50 text-white"
        }`}
      >
        {type === "manual" ? (
          <Save size={14} className="shrink-0" />
        ) : (
          <Check size={14} className="shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
