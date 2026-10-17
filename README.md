# 🚀 TeamFlow AI — AI-Powered Project Management & Collaboration Platform

> **Trello + Notion + AI Project Manager + Real-Time Team Chat**

TeamFlow AI is a production-ready, full-stack collaborative project management platform built with **React 19**, **TypeScript**, **FastAPI**, **SQLAlchemy**, and **WebSockets**. It features workspace-level **RBAC**, real-time live synchronization, and integrated **OpenRouter AI** workflows for project planning, task decomposition, sprint scheduling, deadline-risk analysis, and meeting intelligence.

---

## 🌟 Key Capabilities

- **👥 Multi-Tenant Workspaces & RBAC**: Granular roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) guarding projects, tasks, and administrative functions. Includes instant identity switching between pre-seeded demo personas (`Ruthi`, `Shaaz`, `Rahul`, `Priya`).
- **📋 Real-Time Kanban Board**: Drag-and-drop or 1-click status transitions across `TODO`, `IN PROGRESS`, `IN REVIEW`, and `DONE`. Changes broadcast instantly to all connected users without refreshing.
- **🤖 AI Project Planner**: Transforms raw requirements (e.g. *"Build an e-commerce website with React and FastAPI"*) into structured 4-phase milestone blueprints, with 1-click conversion into real board tasks.
- **🧠 AI Task Decomposition**: 1-click breakdown of high-level deliverables into 4–6 granular subtasks with estimated hours and priorities.
- **📅 AI Sprint Planner**: Analyzes backlog tasks, priority weights, and member velocity to generate balanced 2-week Sprint workload allocations.
- **🚨 Live Deadline Risk Detection**: Computes remaining task hours against available team capacity and project deadlines, emitting risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with prescriptive recommendations.
- **📝 AI Meeting Summarizer**: Extracts executive summaries, architectural decisions, and structured action items with assignees and due dates directly from meeting transcripts.
- **💬 Real-Time Team Chat**: Native FastAPI WebSocket broadcast rooms per workspace for instantaneous team communication.
- **🔎 AI Project Assistant & Search**: Semantic context retrieval across tasks, meetings, and project documentation (e.g., *"What did we decide about authentication?"*, *"What should I work on next?"*).

---

## 🏗️ Architecture

```text
                               TEAMFLOW AI

                                  CLIENT
                         (React 19 + TypeScript)
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                    HTTP REST              WebSocket
                         │                     │
                         ↓                     ↓
              ┌─────────────────────────────────────────┐
              │           FastAPI Gateway               │
              │  • JWT Auth & RBAC Security             │
              │  • WebSocket ConnectionManager Hub      │
              │  • OpenRouter AI Orchestration Engine   │
              └────────────────────┬────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ↓                    ↓                    ↓
      SQLite / PostgreSQL    OpenRouter AI       Broadcast Bus
       • Multi-workspace     • Free & Paid LLMs  • Live task moves
       • Tasks & Comments    • Structured plans  • Live chat messages
       • pgvector ready      • Risk analysis     • Notifications
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Lucide Icons, Vite |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| **Database** | SQLite (default zero-config) / PostgreSQL + pgvector (Supabase) |
| **Real-Time** | Native WebSockets (`/ws/workspace/{workspace_id}`) |
| **AI Integration** | OpenRouter API (`meta-llama/llama-3.3-70b-instruct:free`) + Heuristic Fallback Engine |
| **Deployment** | Vercel (Frontend), Render (Backend), Docker |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server (tables & seed data auto-created on startup)
uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000` with Swagger documentation at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 👥 Demo Personas (Pre-Seeded)

TeamFlow AI is pre-seeded with 4 team members with different RBAC roles to evaluate permissions:

| Persona | Role | Email | Password |
|---|---|---|---|
| **Ruthi (Lead)** | `OWNER` | `ruthi@teamflow.ai` | `password123` |
| **Shaaz (Architect)** | `ADMIN` | `shaaz@teamflow.ai` | `password123` |
| **Rahul (Backend)** | `MEMBER` | `rahul@teamflow.ai` | `password123` |
| **Priya (QA & Data)** | `VIEWER` | `priya@teamflow.ai` | `password123` |

Use the **Demo Identity Switcher** in the top navigation bar to switch between personas instantly without logging out.

---

## 🧪 Running Tests

```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest ../tests
```

---

## ☁️ Free Cloud Deployment Guide

### Frontend → Vercel
1. Push repository to GitHub.
2. In Vercel, import project with root directory set to `frontend`.
3. Set environment variable:
   - `VITE_API_URL`: `https://your-render-backend.onrender.com/api`
4. Deploy!

### Backend → Render
1. In Render, select **New Web Service** from your GitHub repository.
2. Choose **Docker** or **Python** (refer to `render.yaml`).
3. Set environment variables:
   - `DATABASE_URL`: `sqlite:///./teamflow.db` (or Supabase PostgreSQL URI)
   - `OPENROUTER_API_KEY`: your OpenRouter key (optional; defaults to built-in fallback engine)

---

## 📝 Resume Summary (For Ruthi's Portfolio)

**TeamFlow AI — AI-Powered Project Management & Collaboration Platform**
- Developed a full-stack collaborative project management platform using React 19, TypeScript, FastAPI, and SQLAlchemy with workspace-based RBAC and real-time WebSocket state synchronization.
- Integrated OpenRouter-powered AI workflows for milestone planning, task decomposition, sprint scheduling, meeting summarization, and deadline risk analysis.
- Designed deterministic AI fallback generators ensuring 100% operational reliability and zero downtime without required third-party API keys.
- Containerized the backend with multi-stage Docker builds and automated cloud deployment across Vercel and Render.
