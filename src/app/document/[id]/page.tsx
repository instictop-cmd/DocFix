"use client";
"use no memo";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import CollaborativeEditor from "@/components/editor/Editor";

export default function DocumentPage() {
  const params = useParams();
  const documentId = params.id as string;
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  // Check if user already has a name saved
  useEffect(() => {
    const savedName = localStorage.getItem("synora-username");
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  // Name entry screen
  if (!userName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 Synora</h1>
            <p className="text-gray-500">Enter your name to start collaborating</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = nameInput.trim() || "Anonymous";
              localStorage.setItem("synora-username", name);
              setUserName(name);
            }}
          >
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              autoFocus
            />
            <button
              type="submit"
              className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
            >
              Join Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <CollaborativeEditor documentId={documentId} userName={userName} />
    </div>
  );
}
