# TeamFlow AI — System Architecture

## Overview
TeamFlow AI is a real-time full-stack collaborative project management platform combining classic Kanban workflows, WebSocket multi-user synchronization, and integrated OpenRouter AI assistance.

```text
                                TEAMFLOW AI

                                  CLIENTS
                         (React 19 + TypeScript)
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                    HTTP REST              WebSocket
                         │                     │
                         ↓                     ↓
              ┌─────────────────────────────────────────┐
              │           FastAPI Gateway               │
              │  • JWT Auth & RBAC Guards               │
              │  • Async WebSocket ConnectionManager    │
              │  • AI Workflow Orchestration            │
              └────────────────────┬────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ↓                    ↓                    ↓
      PostgreSQL / SQLite    OpenRouter API      Broadcast Bus
       • Multi-workspace     • Free & Paid LLMs  • Live task moves
       • Tasks & Comments    • Structured plans  • Live chat
       • pgvector search     • Risk analysis     • Notifications
```

## Role-Based Access Control (RBAC)
Every workspace member is granted one of four roles:
- **OWNER**: Full administrative control, member invitations, project deletion, workspace management.
- **ADMIN**: Project creation/updates, task creation, member invitation.
- **MEMBER**: Task creation, task movement, status updates, comments, and team chat.
- **VIEWER**: Read-only observation of tasks, project dashboard, and discussions.

## Key Architectural Principles
1. **Controlled AI Assistant**: GenAI is never granted autonomous unrestricted write access. Plans, task decompositions, and sprint assignments are delivered as structured previews requiring human approval before database insertion.
2. **Deterministic Fallbacks**: Every AI endpoint includes a robust deterministic heuristic fallback that functions seamlessly without external API keys or during upstream rate limits.
3. **Database Flexibility**: Default zero-configuration SQLite for local development (`sqlite:///./teamflow.db`) with seamless PostgreSQL/Supabase schema compatibility by simply setting `DATABASE_URL`.
