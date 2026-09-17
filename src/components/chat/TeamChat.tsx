"use client";
"use no memo";

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { MessageSquare, Send, X, Smile, Users } from "lucide-react";

export interface ChatMessage {
  id: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}

interface TeamChatProps {
  isOpen: boolean;
  onClose: () => void;
  ydoc: Y.Doc;
  currentUserName: string;
  currentUserColor: string;
  isDark?: boolean;
  onUnreadCountChange?: (count: number) => void;
}

export default function TeamChat({
  isOpen,
  onClose,
  ydoc,
  currentUserName,
  currentUserColor,
  isDark = false,
  onUnreadCountChange,
}: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatArrayRef = useRef(ydoc.getArray<ChatMessage>("chat_messages"));

  // Track chat messages from Yjs array
  useEffect(() => {
    const chatArray = chatArrayRef.current;

    const updateMessages = () => {
      const allMessages = chatArray.toArray();
      setMessages([...allMessages]);
    };

    chatArray.observe(updateMessages);
    updateMessages();

    return () => {
      chatArray.unobserve(updateMessages);
    };
  }, []);

  // Auto scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userName: currentUserName,
      userColor: currentUserColor,
      text,
      timestamp: Date.now(),
    };

    // Push into CRDT array - instantly syncs to all connected peers!
    chatArrayRef.current.push([newMessage]);
    setInputText("");
  };

  const handleQuickEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed right-4 bottom-14 z-50 w-80 sm:w-96 max-h-[560px] h-[520px] rounded-2xl shadow-2xl border flex flex-col transition-all animate-in slide-in-from-bottom-5 duration-200 ${
        isDark
          ? "bg-gray-900 border-gray-800 text-gray-100"
          : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      {/* Chat Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b rounded-t-2xl ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <MessageSquare size={16} />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
              Team Chat
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-semibold">
                Live
              </span>
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Synced across all document collaborators
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Message List */}
      <div
        className={`flex-1 overflow-y-auto p-3.5 space-y-3 ${
          isDark ? "bg-gray-950/40" : "bg-slate-50/50"
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
              <MessageSquare size={20} />
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              No chat messages yet
            </p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
              Say hello or discuss edits with your team in real-time!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userName === currentUserName;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                  <span
                    className="font-bold"
                    style={{ color: msg.userColor || "#2563eb" }}
                  >
                    {isMe ? "You" : msg.userName}
                  </span>
                  <span>•</span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[85%] text-xs break-words shadow-xs ${
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-xs"
                      : isDark
                        ? "bg-gray-800 text-gray-100 rounded-tl-xs border border-gray-700"
                        : "bg-white text-gray-800 rounded-tl-xs border border-gray-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reaction Bar */}
      <div
        className={`px-3 py-1.5 flex items-center gap-1.5 border-t text-xs ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-gray-50/70 border-gray-200"
        }`}
      >
        <span className="text-[10px] text-gray-400 font-medium">Quick:</span>
        {["👋", "👍", "🔥", "🚀", "🎉", "❤️"].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            className="hover:scale-125 transition-transform p-0.5 cursor-pointer text-xs"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className={`p-3 border-t flex items-center gap-2 rounded-b-2xl ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message as ${currentUserName}...`}
          className={`flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDark
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
          }`}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2 rounded-xl text-white transition-all cursor-pointer ${
            inputText.trim()
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
          title="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
