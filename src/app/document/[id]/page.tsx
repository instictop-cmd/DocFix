"use client";
"use no memo";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import CollaborativeEditor from "@/components/editor/Editor";
import { User, Shield, Sparkles, ArrowRight, Lock } from "lucide-react";

// Pre-defined demo profiles for instant hackathon testing
const DEMO_PROFILES = [
  {
    name: "Alice",
    role: "Lead Architect (Host)",
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

export default function DocumentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params.id as string;
  const urlRole = searchParams.get("role") === "viewer" ? "viewer" : "editor";

  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"editor" | "viewer">(urlRole);
  const [nameInput, setNameInput] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Restore saved username immediately on mount
  useEffect(() => {
    try {
      const savedName =
        localStorage.getItem("docfix-username") ||
        localStorage.getItem("synora-username");
      const savedRole = localStorage.getItem("docfix-userrole") as
        | "editor"
        | "viewer"
        | null;

      if (savedName) {
        setUserName(savedName);
      }
      if (savedRole && !searchParams.get("role")) {
        setUserRole(savedRole);
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsCheckingAuth(false);
    }
  }, [searchParams]);

  const handleJoinWithProfile = (name: string, role: "editor" | "viewer") => {
    localStorage.setItem("docfix-username", name);
    localStorage.setItem("docfix-userrole", role);
    setUserName(name);
    setUserRole(role);
  };

  // Fast loading state during initial localStorage check (prevents flash of join screen)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-blue-400">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-300">Loading document...</span>
        </div>
      </div>
    );
  }

  // Name / Profile Entry Screen (Only shown if user has never selected a name)
  if (!userName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-white/20">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl mb-3 shadow-lg shadow-blue-500/30">
              📄
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Join DocFix Workspace
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select a demo profile or enter your custom name
            </p>
          </div>

          {/* Quick Demo Profiles */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Instant Hackathon Demo Profiles
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {DEMO_PROFILES.map((profile) => (
                <button
                  key={profile.name}
                  type="button"
                  onClick={() => handleJoinWithProfile(profile.name, profile.type)}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                      style={{ backgroundColor: profile.color }}
                    >
                      {profile.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {profile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {profile.role}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      profile.type === "viewer"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    }`}
                  >
                    {profile.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
            <span className="flex-shrink mx-4 text-xs text-gray-400 font-medium">
              Or Custom Name
            </span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
          </div>

          {/* Custom Name Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = nameInput.trim() || "Anonymous User";
              handleJoinWithProfile(name, "editor");
            }}
            className="mt-3 space-y-3"
          >
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter custom username..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-blue-500/20"
            >
              <span>Enter Workspace</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <CollaborativeEditor
      documentId={documentId}
      userName={userName}
      userRole={userRole}
    />
  );
}
