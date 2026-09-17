# 📄 DocFix — Real-Time Collaborative Document Engine

> **SYNORA Hackathon — Full Stack Engineering Track**  
> A high-performance, fault-tolerant Google Docs-style rich text editor with real-time multi-user synchronization, Conflict-Free Replicated Data Types (CRDT), live cursor presence, dual-tier offline persistence, and deep distributed systems telemetry.

---

## 🌟 Core Architecture & Technical Highlights

DocFix solves the fundamental challenges of distributed state synchronization:

1. **Yjs YATA CRDT (Zero Last-Write-Wins):** All mutations converge mathematically to identical state regardless of arrival order or network partitions.
2. **Sub-Millisecond Real-Time Networking:** Dedicated binary WebSocket server (Node.js + `y-protocols`) relaying compact delta packets with zero bloat.
3. **Live Ephemeral Presence:** Real-time colored cursor carets and active multi-user selection highlighting powered by the Yjs Awareness protocol.
4. **Dual-Tier Fault-Tolerant Persistence:** 
   - **Client-Side:** `IndexedDB` (`y-indexeddb`) for uninterrupted offline typing and instant local restoration.
   - **Server-Side:** Crash-resilient file persistence (`.yjs` binary snapshots).
5. **CRDT & Distributed Systems Diagnostics HUD:**
   - **Cryptographic State Hash (SHA-256):** Provides mathematical proof of 100% convergence across clients.
   - **Memory Footprint Telemetry:** Live serialized CRDT document size in KB.
   - **Logical Vector Clocks:** Exposes per-client Lamport clocks.
   - **WebSocket Roundtrip Latency:** Live ping monitor.
6. **Network Chaos & Partition Simulator:** Built-in latency injection (500ms lag) and partition simulator to demo real-world partition tolerance.
7. **Role-Based Access Control:** Pre-configured demo profiles (Alice [Host], Bob [Editor], Charlie [Viewer - Read Only]).
8. **Product Polish:** Dark/Light theme, Zen focus mode, multi-format export (Markdown, HTML, PDF), and live word/char counters.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Editor Canvas** | TipTap v3 + ProseMirror |
| **CRDT Engine** | Yjs (YATA Algorithm) |
| **Real-time Networking** | WebSockets (`ws`) + `y-protocols` + `y-websocket` |
| **Client Storage** | Browser IndexedDB (`y-indexeddb`) |
| **Server Persistence** | Disk (`.yjs` binary snapshots) |
| **Styling & UI** | Tailwind CSS v4 + Lucide React |

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/instictop-cmd/DocFix.git
cd DocFix
npm install
```

### 2. Start Collaboration Server & Next.js App
```bash
npm run dev:collab
```

- **Web App:** [http://localhost:3000](http://localhost:3000)
- **WebSocket Server:** `ws://localhost:1234`
- **Server Health Check:** [http://localhost:1234/health](http://localhost:1234/health)

---

## 🧪 Testing Multi-User Collaboration

1. Open **`http://localhost:3000`** in your browser and log in as **Alice**.
2. Click **"+ New Document"**, name your document, and open it.
3. In the top bar, click **"🔗 Invite / Share"** to copy the document URL.
4. Open an **Incognito Window**, paste the URL, and select **Bob**.
5. Put both windows side-by-side and edit simultaneously!

---

## 📊 Distributed Systems Proof (Judge Demo)

- Open the **"CRDT Telemetry"** pill in the bottom right corner of both windows.
- Compare the **SHA-256 State Hash** across both windows — both calculate the exact same hash, proving zero race conditions and zero data loss.
- Toggle the **"500ms Lag"** or **"Offline (Partition)"** simulation in the top bar, edit concurrently, and watch the CRDT merge seamlessly upon reconnection.
