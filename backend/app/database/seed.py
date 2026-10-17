import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database.session import Base, engine, SessionLocal
from app.models.models import User, Workspace, WorkspaceMember, Project, Task, Comment, Message, Meeting, Document, Notification
from app.core.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).first():
            return

        print("Seeding TeamFlow AI database...")

        # 1. Users
        password_hash = get_password_hash("password123")
        users = [
            User(
                email="ruthi@teamflow.ai",
                full_name="Ruthi (Lead)",
                password_hash=password_hash,
                avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
            ),
            User(
                email="shaaz@teamflow.ai",
                full_name="Shaaz (Architect)",
                password_hash=password_hash,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            ),
            User(
                email="rahul@teamflow.ai",
                full_name="Rahul (Backend)",
                password_hash=password_hash,
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
            ),
            User(
                email="priya@teamflow.ai",
                full_name="Priya (QA & Data)",
                password_hash=password_hash,
                avatar_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
            ),
        ]
        db.add_all(users)
        db.commit()

        u_ruthi, u_shaaz, u_rahul, u_priya = users

        # 2. Workspace
        workspace = Workspace(
            name="Startup Project Workspace",
            slug="startup-project",
            owner_id=u_ruthi.id
        )
        db.add(workspace)
        db.commit()

        # Members with distinct RBAC roles
        members = [
            WorkspaceMember(workspace_id=workspace.id, user_id=u_ruthi.id, role="OWNER"),
            WorkspaceMember(workspace_id=workspace.id, user_id=u_shaaz.id, role="ADMIN"),
            WorkspaceMember(workspace_id=workspace.id, user_id=u_rahul.id, role="MEMBER"),
            WorkspaceMember(workspace_id=workspace.id, user_id=u_priya.id, role="VIEWER"),
        ]
        db.add_all(members)
        db.commit()

        # 3. Projects
        p1 = Project(
            workspace_id=workspace.id,
            name="E-Commerce Website",
            description="Production-grade headless e-commerce store with React, FastAPI, and Stripe checkout.",
            deadline=datetime.utcnow() + timedelta(days=16)
        )
        p2 = Project(
            workspace_id=workspace.id,
            name="Mobile Application",
            description="Cross-platform iOS and Android app for on-demand field logistics.",
            deadline=datetime.utcnow() + timedelta(days=30)
        )
        p3 = Project(
            workspace_id=workspace.id,
            name="Marketing & Launch Campaign",
            description="Product Hunt launch, viral demo video, documentation hub, and landing page.",
            deadline=datetime.utcnow() + timedelta(days=22)
        )
        db.add_all([p1, p2, p3])
        db.commit()

        # 4. Tasks for E-Commerce Website
        now = datetime.utcnow()
        tasks = [
            Task(
                project_id=p1.id,
                assignee_id=u_priya.id,
                title="Database Schema & Migrations",
                description="Finalized SQLite and PostgreSQL tables for Users, Workspaces, Projects, and Tasks with proper FKs and indexes.",
                status="DONE",
                priority="HIGH",
                estimated_hours=6.0,
                actual_hours=5.5,
                labels="Database,Backend",
                position=0,
                deadline=now - timedelta(days=2)
            ),
            Task(
                project_id=p1.id,
                assignee_id=u_ruthi.id,
                title="UI Wireframes & Component Tokens",
                description="Defined dark obsidian theme tokens, typography, button states, and Kanban column layouts.",
                status="DONE",
                priority="HIGH",
                estimated_hours=8.0,
                actual_hours=7.0,
                labels="Design,Frontend",
                position=1,
                deadline=now - timedelta(days=1)
            ),
            Task(
                project_id=p1.id,
                assignee_id=u_rahul.id,
                title="API Authentication with JWT & RBAC",
                description="Implement /auth/register and /auth/login endpoints with bcrypt password hashing and workspace role guards.",
                status="IN_PROGRESS",
                priority="URGENT",
                estimated_hours=8.0,
                actual_hours=4.0,
                labels="Security,Backend",
                position=0,
                deadline=now + timedelta(days=2)
            ),
            Task(
                project_id=p1.id,
                assignee_id=u_ruthi.id,
                title="Interactive Kanban Board & Drag-Drop",
                description="Live board supporting TODO, IN PROGRESS, IN REVIEW, DONE status transitions with WebSocket sync.",
                status="IN_PROGRESS",
                priority="HIGH",
                estimated_hours=10.0,
                actual_hours=5.0,
                labels="Frontend,Realtime",
                position=1,
                deadline=now + timedelta(days=4)
            ),
            Task(
                project_id=p1.id,
                assignee_id=u_shaaz.id,
                title="Payment Gateway Integration",
                description="Stripe Checkout session generation, webhook fulfillment, and order confirmation emails.",
                status="TODO",
                priority="URGENT",
                estimated_hours=12.0,
                actual_hours=0.0,
                labels="Payment,Backend",
                position=0,
                deadline=now + timedelta(days=5)
            ),
            Task(
                project_id=p1.id,
                assignee_id=u_rahul.id,
                title="Product Catalog & Search Filters",
                description="Server-side filtering, category pagination, and keyword search across inventory.",
                status="TODO",
                priority="HIGH",
                estimated_hours=8.0,
                actual_hours=0.0,
                labels="Frontend,API",
                position=1,
                deadline=now + timedelta(days=7)
            ),
            Task(
                project_id=p1.id,
                assignee_id=u_priya.id,
                title="Automated Test Suite & Edge Cases",
                description="Pytest integration coverage for RBAC authorization violations and invalid tokens.",
                status="TODO",
                priority="MEDIUM",
                estimated_hours=6.0,
                actual_hours=0.0,
                labels="Testing,QA",
                position=2,
                deadline=now + timedelta(days=10)
            ),
            Task(
                project_id=p1.id,
                assignee_id=u_shaaz.id,
                title="Docker Containerization & Render Setup",
                description="Write multi-stage Dockerfile and render.yaml deployment configuration.",
                status="TODO",
                priority="HIGH",
                estimated_hours=4.0,
                actual_hours=0.0,
                labels="DevOps,Cloud",
                position=3,
                deadline=now + timedelta(days=12)
            ),
        ]
        db.add_all(tasks)
        db.commit()

        # 5. Comments on Task
        task_auth = tasks[2]
        c1 = Comment(
            task_id=task_auth.id,
            user_id=u_ruthi.id,
            content="Make sure refresh tokens expire after 7 days and include the workspace_id claim."
        )
        c2 = Comment(
            task_id=task_auth.id,
            user_id=u_rahul.id,
            content="Added! Working on the FastAPI OAuth2 security dependency now."
        )
        db.add_all([c1, c2])
        db.commit()

        # 6. Team Chat Messages
        chat_msgs = [
            Message(workspace_id=workspace.id, project_id=p1.id, user_id=u_ruthi.id, content="Hey team! Kanban board and project planning routes are live.", created_at=now - timedelta(minutes=40)),
            Message(workspace_id=workspace.id, project_id=p1.id, user_id=u_rahul.id, content="Awesome! Working on the JWT auth verification tests right now.", created_at=now - timedelta(minutes=30)),
            Message(workspace_id=workspace.id, project_id=p1.id, user_id=u_priya.id, content="Database models and seed records are pushed. Everything matches the spec.", created_at=now - timedelta(minutes=20)),
            Message(workspace_id=workspace.id, project_id=p1.id, user_id=u_shaaz.id, content="Great velocity! I'll test the WebSocket broadcast and AI deadline risk analysis.", created_at=now - timedelta(minutes=10)),
        ]
        db.add_all(chat_msgs)
        db.commit()

        # 7. Meeting Notes
        meeting_decisions = [
            "Use SQLite for local zero-config development, with seamless Supabase/PostgreSQL schema compatibility.",
            "Deploy FastAPI backend container to Render and React frontend to Vercel.",
            "Use WebSockets for real-time Kanban board updates and team chat.",
            "Use OpenRouter API with fallback heuristic generator so AI works without paid keys."
        ]
        meeting_actions = [
            {"assignee_name": "Ruthi", "task_title": "Design authentication and Kanban board UI", "due_date": "Nov 5", "priority": "HIGH"},
            {"assignee_name": "Rahul", "task_title": "Implement JWT authentication and RBAC endpoints", "due_date": "Nov 8", "priority": "HIGH"},
            {"assignee_name": "Priya", "task_title": "Set up database schema and seed data", "due_date": "Nov 4", "priority": "MEDIUM"},
            {"assignee_name": "Shaaz", "task_title": "Configure OpenRouter integration and WebSocket broadcast manager", "due_date": "Nov 10", "priority": "HIGH"}
        ]
        meeting = Meeting(
            project_id=p1.id,
            title="Sprint 1 Architecture & Tech Stack Kickoff",
            transcript=(
                "Ruthi: Welcome everyone. Today we finalize the architecture for TeamFlow AI. "
                "We need full-stack collaboration, Kanban task tracking, and AI assistance.\n"
                "Rahul: For backend, FastAPI with SQLAlchemy gives us great async performance. "
                "Let's use SQLite for zero-config local development and support Supabase/Postgres with pgvector.\n"
                "Shaaz: Agreed. We should use native WebSockets for instant task updates so when someone moves a card, everyone sees it.\n"
                "Priya: What about AI? We should use OpenRouter API for project planning, risk analysis, and meeting summarization.\n"
                "Ruthi: Perfect. Let's make sure the AI acts as an assistant with human-in-the-loop approvals before creating tasks."
            ),
            summary="Kickoff sync establishing architecture, tech stack (React + TypeScript + FastAPI + SQLite), WebSocket sync, and AI Assistant boundaries.",
            decisions=json.dumps(meeting_decisions),
            action_items=json.dumps(meeting_actions)
        )
        db.add(meeting)
        db.commit()

        # 8. Document
        doc = Document(
            project_id=p1.id,
            title="System Architecture & RBAC Guidelines",
            content=(
                "TeamFlow AI Architecture:\n"
                "1. React 19 Frontend with modern dark-mode aesthetic and Lucide icons.\n"
                "2. FastAPI Backend exposing REST endpoints + WebSocket /ws/workspace/{id}.\n"
                "3. Role-Based Access Control:\n"
                "   - OWNER: Complete workspace authority, member management, project deletion.\n"
                "   - ADMIN: Member invite, project and task creation/updates.\n"
                "   - MEMBER: Task creation, status updates, comments, and chat.\n"
                "   - VIEWER: Read-only access to projects, tasks, and discussions.\n"
                "4. AI Integration: Controlled human-in-the-loop task generation via OpenRouter."
            ),
            filename="architecture.md"
        )
        db.add(doc)
        db.commit()

        # 9. Notifications
        notifs = [
            Notification(
                user_id=u_ruthi.id,
                type="ASSIGNMENT",
                title="Task Assignment",
                content="Shaaz assigned you to 'Interactive Kanban Board & Drag-Drop'.",
                read=False,
                link_url=f"/projects/{p1.id}"
            ),
            Notification(
                user_id=u_ruthi.id,
                type="AI_WARNING",
                title="AI Sprint Alert",
                content="AI Risk Detector: Project has 44 hours of work remaining against tight deadline. Check Sprint recommendations.",
                read=False,
                link_url=f"/projects/{p1.id}"
            ),
        ]
        db.add_all(notifs)
        db.commit()

        print("Database seeded successfully with users, workspace, projects, tasks, chat, and meeting data!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
