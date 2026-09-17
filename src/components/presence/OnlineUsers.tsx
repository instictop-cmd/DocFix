"use client";
"use no memo";

import { Editor } from "@tiptap/react";

interface OnlineUsersProps {
  editor: Editor;
}

export default function OnlineUsers({ editor }: OnlineUsersProps) {
  // Read users from collaborationCaret storage (TipTap v3)
  const rawUsers: Array<{ clientId: number; [key: string]: unknown }> =
    editor.storage.collaborationCaret?.users ?? [];

  if (rawUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {rawUsers.map((user, index) => {
        const name = (user.name as string) || "Anonymous";
        const color = (user.color as string) || "#6B7280";
        return (
          <div
            key={user.clientId ?? index}
            className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold border-2 border-white shadow-sm"
            style={{ backgroundColor: color }}
            title={name}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        );
      })}
      <span className="text-xs text-gray-500 ml-1">
        {rawUsers.length} online
      </span>
    </div>
  );
}
