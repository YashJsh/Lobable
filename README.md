# Lobable — AI Agent Sandbox Builder

Lobable is an AI-powered agentic workspace that enables building, running, and editing full-stack Next.js applications dynamically in secure, isolated sandbox environments.

---

## What Lobable Does

*   **Multi-Provider AI Orchestration:** Supports dynamic selection of LLM models and providers (such as Groq and OpenAI) from client payloads. The main orchestration agent plans features and delegates actual code writing to stateless sub-agents.
*   **Secure Code Sandbox (E2B):** Utilizes E2B Sandbox technology to spin up isolated container environments for each project. Code edits, dependency installations, and shell command executions happen inside secure virtual environments running Next.js.
*   **User Persistence & Auditing:** Includes a relational database backend (Prisma + PostgreSQL) with JWT auth, managing users, isolated workspace projects (tracked via unique `sandboxId` keys), and conversation audit trails.

---

## Current Status (Backend Completed ✅)

The backend features have been fully implemented, type-checked, and verified:
1.  **Authentication:** Signup, signin, and request authentication middleware are active under `/v1/api/auth`.
2.  **Stateful Projects:** Automated database hooks create a project and record user/assistant chat transcripts under `/v1/api/agent`.
3.  **Sandbox Session Recovery:** If the backend server restarts, the route handlers automatically recover the project's state from the database and reconnect to the active E2B sandbox session.
4.  **Versioned Router:** Mounted all routes cleanly under `/v1/api/`.


