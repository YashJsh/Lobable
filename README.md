# Lobable — AI Agent Sandbox Builder (v1.0)

Lobable is a premium developer workspace designed to build, run, and modify Next.js applications dynamically in isolated E2B sandboxes using AI agents. 

Version 1.0 establishes full-stack integration for user authentication, project persistence, dynamic sandbox orchestration, and historical chat restoration.

---

## Key Features

### 🤖 Multi-Provider AI Orchestration
*   **Provider Integration:** Instantiates models via OpenAI or Groq dynamically.
*   **Stateless Sub-Agents:** Main agent parses user inputs and spawns targeted sub-agents for writing files, reading code, or executing terminal commands.

### 🌐 Secure Code Sandbox (E2B)
*   **Isolated Containers:** Each project gets a clean, sandboxed Next.js container environment.
*   **Lifecycle Persistence:** Supports reconnecting to active container sessions dynamically via stored `sandboxId` keys.

### 🗄️ Relational Database (Prisma + PostgreSQL)
*   **User Accounts:** Encrypted credentials storage with password hashing (`bcryptjs`) and signed sessions (`jsonwebtoken`).
*   **Workspace Archiving:** Persists projects, conversations, and message logs (`USER` and `ASSISTANT` records) inside PostgreSQL.

### 🎨 State Management & Sidebar Shell (Zustand + Tailwind)
*   **Zustand Auth Store:** Manages current user profiles, session tokens, and local storage syncer hooks.
*   **Zustand Project Store:** Manages active workspaces, scrollable project listings, historical chat restoration, and build status.
*   **Dashboard Sidebar:** Premium glassmorphic side navigation for navigating previous workspaces, initiating new apps, and managing profile logouts.
*   **Schema-Validated Forms:** Login and registration views validated via `react-hook-form` and `zod` resolving.

---

## Core System Architecture

```mermaid
graph TD
    Client[Frontend App] -->|v1/api/auth| Auth[Auth Routes]
    Client -->|v1/api/project| Project[Project Routes]
    Client -->|v1/api/agent| Agent[Agent Routes]
    
    Auth -->|Credentials Check| DB[(PostgreSQL Database)]
    Project -->|Fetch Workspaces & Logs| DB
    Agent -->|Record Messages & Project| DB
    Agent -->|Spin-up / Reconnect| E2B[E2B Sandbox Container]
```

---

## Getting Started

### 1. Database Setup
Ensure PostgreSQL is running locally, then initialize the database schema in the `backend/` workspace:
```bash
bunx prisma migrate dev
bunx prisma generate
```

### 2. Environment Variables
Configure `.env` in `backend/`:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/lobable"
JWT_SECRET="your-jwt-signing-secret"
OPENAI_API_KEY="your-openai-api-key"
GROQ_API_KEY="your-groq-api-key"
E2B_API_KEY="your-e2b-api-key"
```

### 3. Running Dev Servers
Run the backend server:
```bash
cd backend
bun run dev
```

Run the frontend workspace:
```bash
cd frontend
bun run dev
```
Navigate to `http://localhost:3000` to start creating workspaces.
