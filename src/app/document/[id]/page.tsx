"use client";
"use no memo";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import CollaborativeEditor from "@/components/editor/Editor";
import { ArrowRight } from "lucide-react";

// Pre-defined profiles for hackathon judging & quick testing
const PROFILES = [
  {
    name: "Alice",
    role: "Lead Architect",
    color: "#2563EB",
    type: "editor" as const,
    badge: "Editor",
  },
  {
    name: "Bob",
    role: "Product Designer",
    color: "#059669",
    type: "editor" as const,
    badge: "Editor",
  },
  {
    name: "Charlie",
    role: "Security Auditor",
    color: "#D97706",
    type: "viewer" as const,
    badge: "Viewer (Read-Only)",
  },
];

interface UserProfile {
  name: string;
  role: string;
  color: string;
  type: "editor" | "viewer";
}

export default function DocumentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params.id as string;
  const urlRole = searchParams.get("role") === "viewer" ? "viewer" : "editor";

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [customNameInput, setCustomNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem("docfix-active-user");
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        setCurrentUser({
          ...parsed,
          type: urlRole === "viewer" ? "viewer" : parsed.type || "editor",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [urlRole]);

  // Login handler
  const handleSelectProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    localStorage.setItem("docfix-active-user", JSON.stringify(profile));
    localStorage.setItem("docfix-username", profile.name);
    localStorage.setItem("docfix-userrole", profile.type);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-blue-400">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-300">
            Opening document...
          </span>
        </div>
      </div>
    );
  }

  // If user is not logged in yet (e.g. opened shared link in fresh Incognito window)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl mb-3 shadow-lg shadow-blue-500/25">
              📄
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Join Document Session
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Select your profile to collaborate on this document
            </p>
          </div>

          {/* Quick Profiles */}
          <div className="space-y-2.5 mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Who Is Working
            </label>
            {PROFILES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() =>
                  handleSelectProfile({
                    name: p.name,
                    role: p.role,
                    color: p.color,
                    type: urlRole === "viewer" ? "viewer" : p.type,
                  })
                }
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {p.role}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    p.type === "viewer" || urlRole === "viewer"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                  }`}
                >
                  {urlRole === "viewer" ? "Viewer" : p.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-4 text-xs text-slate-400 font-medium">
              or enter custom name
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Custom Name Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = customNameInput.trim() || "Guest Editor";
              handleSelectProfile({
                name,
                role: "Custom Editor",
                color: "#7C3AED",
                type: urlRole,
              });
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={customNameInput}
              onChange={(e) => setCustomNameInput(e.target.value)}
              placeholder="Your name..."
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Once logged in, load the collaborative editor immediately
  return (
    <CollaborativeEditor
      documentId={documentId}
      userName={currentUser.name}
      userRole={currentUser.type}
    />
  );
}
