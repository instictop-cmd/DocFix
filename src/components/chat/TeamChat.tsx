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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <MessageSquare size={16} />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 leading-tight flex items-center gap-1.5">
              Team Chat
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full font-semibold">
                Live
              </span>
            </h4>
            <p className="text-[10px] text-stone-500 dark:text-stone-400">
              Synced across all document collaborators
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Message List */}
      <div
        className={`flex-1 overflow-y-auto p-3.5 space-y-3 ${
          isDark ? "bg-stone-950/40" : "bg-[#FAF7F2]/60"
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center mb-2">
              <MessageSquare size={20} />
            </div>
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              No chat messages yet
            </p>
            <p className="text-[11px] text-stone-400 mt-1 max-w-[200px]">
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
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-stone-400">
                  <span
                    className="font-bold"
                    style={{ color: msg.userColor || "#ea580c" }}
                  >
                    {isMe ? "You" : msg.userName}
                  </span>
                  <span>•</span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[85%] text-xs break-words shadow-xs ${
                    isMe
                      ? "bg-orange-500 text-white rounded-tr-xs"
                      : isDark
                        ? "bg-stone-800 text-stone-100 rounded-tl-xs border border-stone-700"
                        : "bg-white text-stone-800 rounded-tl-xs border border-stone-200"
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

      {/* Quick Reaction Emojis Bar */}
      <div className="px-3 py-1.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-around bg-stone-50/50 dark:bg-stone-900/50">
        {["👍", "❤️", "🔥", "🎉", "👀", "🚀"].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            className="hover:scale-125 transition-transform text-sm cursor-pointer p-1"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className={`p-3 border-t flex items-center gap-2 rounded-b-2xl ${
          isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
        }`}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message as ${currentUserName}...`}
          className={`flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50 ${
            isDark
              ? "bg-stone-800 border-stone-700 text-white placeholder-stone-500"
              : "bg-[#FAF7F2] border-stone-200 text-stone-900 placeholder-stone-400"
          }`}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2 rounded-xl text-white transition-all cursor-pointer ${
            inputText.trim()
              ? "bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-500/20"
              : "bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed"
          }`}
          title="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
