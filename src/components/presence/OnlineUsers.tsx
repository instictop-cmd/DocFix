"use client";
"use no memo";

import { Editor } from "@tiptap/react";
import { UserCheck, Eye } from "lucide-react";

interface OnlineUsersProps {
  editor: Editor;
  onFollowUser?: (userName: string) => void;
  followingUser?: string | null;
}

export default function OnlineUsers({
  editor,
  onFollowUser,
  followingUser,
}: OnlineUsersProps) {
  // Read users from collaborationCaret storage (TipTap v3)
  const rawUsers: Array<{ clientId: number; [key: string]: unknown }> =
    editor.storage.collaborationCaret?.users ?? [];

  if (rawUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center -space-x-1.5 overflow-hidden p-0.5">
        {rawUsers.map((user, index) => {
          const name = (user.name as string) || "Anonymous";
          const color = (user.color as string) || "#3B82F6";
          const isFollowing = followingUser === name;

          return (
            <button
              type="button"
              key={user.clientId ?? index}
              onClick={() => onFollowUser?.(name)}
              className={`relative flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold border-2 transition-transform hover:scale-110 hover:z-20 cursor-pointer shadow-sm ${
                isFollowing
                  ? "ring-2 ring-blue-500 ring-offset-2 border-white scale-105 z-10"
                  : "border-white"
              }`}
              style={{ backgroundColor: color }}
              title={`Click to ${isFollowing ? "unfollow" : "follow"} ${name}'s cursor`}
            >
              {name.charAt(0).toUpperCase()}
              {isFollowing && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[8px] text-white">
                  <Eye size={9} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col text-left ml-1 hidden sm:flex">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none">
          {rawUsers.length} {rawUsers.length === 1 ? "editor" : "editors"}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-400">
          {followingUser ? `Following ${followingUser}` : "Click avatar to follow"}
        </span>
      </div>
    </div>
  );
}
