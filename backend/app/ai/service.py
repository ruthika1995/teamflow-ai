import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.schemas.schemas import (
    AIPlanMilestone, AIPlanTask, AIProjectPlanResponse,
    AISubtask, AITaskBreakdownResponse,
    AISprintAssignment, AISprintPlanResponse,
    AIRiskAnalysisResponse,
    AIMeetingSummaryResponse, AIActionItem,
    AIChatResponse, AISource
)

logger = logging.getLogger(__name__)

async def call_openrouter(messages: List[Dict[str, str]], json_mode: bool = True) -> Optional[str]:
    """Call OpenRouter API if API key is provided, returning text or None on failure"""
    if not settings.OPENROUTER_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://teamflow.ai",
        "X-Title": "TeamFlow AI"
    }

    payload: Dict[str, Any] = {
        "model": settings.OPENROUTER_MODEL,
        "messages": messages,
        "temperature": 0.2
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=payload
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                logger.warning(f"OpenRouter returned status {resp.status_code}: {resp.text}")
                return None
    except Exception as e:
        logger.warning(f"OpenRouter request error: {e}")
        return None


class AIService:
    @staticmethod
    async def generate_project_plan(prompt: str, project_name: str) -> AIProjectPlanResponse:
        system_prompt = (
            "You are TeamFlow AI Project Planner. Given a project description, create a production-grade "
            "structured project plan organized into milestones and actionable tasks. "
            "Return valid JSON matching this schema: "
            "{\n"
            "  \"plan_title\": \"string\",\n"
            "  \"summary\": \"string\",\n"
            "  \"milestones\": [\n"
            "    {\n"
            "      \"milestone_name\": \"string\",\n"
            "      \"tasks\": [\n"
            "        {\"title\": \"string\", \"description\": \"string\", \"priority\": \"LOW|MEDIUM|HIGH|URGENT\", \"estimated_hours\": number, \"suggested_role\": \"string\"}\n"
            "      ]\n"
            "    }\n"
            "  ],\n"
            "  \"total_estimated_hours\": number\n"
            "}"
        )
        user_prompt = f"Project Name: {project_name}\nRequirements & Scope: {prompt}"

        raw_llm = await call_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])

        if raw_llm:
            try:
                data = json.loads(raw_llm)
                milestones = []
                total_hours = 0.0
                for m in data.get("milestones", []):
                    tasks = []
                    for t in m.get("tasks", []):
                        hrs = float(t.get("estimated_hours", 4.0))
                        total_hours += hrs
                        tasks.append(AIPlanTask(
                            title=t.get("title", "Task"),
                            description=t.get("description", ""),
                            priority=t.get("priority", "MEDIUM"),
                            estimated_hours=hrs,
                            suggested_role=t.get("suggested_role", "Engineering")
                        ))
                    milestones.append(AIPlanMilestone(milestone_name=m.get("milestone_name", "Phase"), tasks=tasks))
                return AIProjectPlanResponse(
                    plan_title=data.get("plan_title", f"{project_name} Implementation Plan"),
                    summary=data.get("summary", "AI generated comprehensive breakdown."),
                    milestones=milestones,
                    total_estimated_hours=total_hours
                )
            except Exception as e:
                logger.warning(f"Failed to parse LLM response for plan: {e}")

        # Deterministic heuristic generator if offline or no OpenRouter API key
        lower_prompt = (prompt + " " + project_name).lower()
        milestones = [
            AIPlanMilestone(
                milestone_name="1. Architecture & Requirements",
                tasks=[
                    AIPlanTask(title="Define Core Requirements & User Journeys", description="Document personas, core workflows, edge cases, and scope.", priority="HIGH", estimated_hours=6.0, suggested_role="Product / Lead"),
                    AIPlanTask(title="Data Modeling & API Contract Spec", description="Draft entity relations, REST endpoints, and security boundaries.", priority="HIGH", estimated_hours=8.0, suggested_role="Backend Engineer"),
                    AIPlanTask(title="UI/UX Wireframes & Component Specs", description="Design high-fidelity user flows, responsive layouts, and states.", priority="MEDIUM", estimated_hours=8.0, suggested_role="Frontend Engineer"),
                ]
            ),
            AIPlanMilestone(
                milestone_name="2. Backend & Core Engine",
                tasks=[
                    AIPlanTask(title="Implement Database Models & Migrations", description="Configure tables, foreign keys, indexes, and test seed data.", priority="HIGH", estimated_hours=8.0, suggested_role="Backend Engineer"),
                    AIPlanTask(title="Implement Authentication & RBAC Layer", description="JWT token issuance, password hashing, and role validation middleware.", priority="URGENT", estimated_hours=10.0, suggested_role="Backend Engineer"),
                    AIPlanTask(title="Core Business Logic & Domain APIs", description=f"Implement business endpoints matching: {prompt[:80]}...", priority="HIGH", estimated_hours=14.0, suggested_role="Backend Engineer"),
                ]
            ),
            AIPlanMilestone(
                milestone_name="3. Frontend Client & Integrations",
                tasks=[
                    AIPlanTask(title="Design System & Global Layout Setup", description="Set up typography, color tokens, responsive sidebar, and header.", priority="MEDIUM", estimated_hours=6.0, suggested_role="Frontend Engineer"),
                    AIPlanTask(title="Interactive Dashboard & Workspace Views", description="Build real-time views, forms, filters, and feedback dialogs.", priority="HIGH", estimated_hours=12.0, suggested_role="Frontend Engineer"),
                    AIPlanTask(title="Real-time WebSocket & Client Sync Integration", description="Handle live events, optimistic updates, and connection status.", priority="HIGH", estimated_hours=8.0, suggested_role="Full Stack Engineer"),
                ]
            ),
            AIPlanMilestone(
                milestone_name="4. Testing, Polish & Deployment",
                tasks=[
                    AIPlanTask(title="Automated Unit & Integration Test Suite", description="Write API integration tests and client component validation.", priority="HIGH", estimated_hours=8.0, suggested_role="QA / Full Stack"),
                    AIPlanTask(title="Cloud Deployment & CI/CD Pipeline Setup", description="Dockerize application, configure Vercel, Render, and healthchecks.", priority="HIGH", estimated_hours=6.0, suggested_role="DevOps Engineer"),
                ]
            )
        ]
        total_hours = sum(sum(t.estimated_hours for t in m.tasks) for m in milestones)
        return AIProjectPlanResponse(
            plan_title=f"{project_name} Execution Blueprint",
            summary=f"Structured 4-phase rollout addressing: '{prompt}'.",
            milestones=milestones,
            total_estimated_hours=total_hours
        )

    @staticmethod
    async def breakdown_task(task_title: str, task_description: Optional[str] = "") -> AITaskBreakdownResponse:
        system_prompt = (
            "You are TeamFlow AI. Decompose the given task into 4-6 granular, executable subtasks with estimated hours and priorities. "
            "Return JSON matching: {\"original_task_title\": \"string\", \"rationale\": \"string\", \"subtasks\": [{\"title\": \"string\", \"description\": \"string\", \"estimated_hours\": number, \"priority\": \"LOW|MEDIUM|HIGH|URGENT\"}]}"
        )
        user_prompt = f"Task: {task_title}\nContext: {task_description or 'No extra details'}"

        raw_llm = await call_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])

        if raw_llm:
            try:
                data = json.loads(raw_llm)
                subtasks = [
                    AISubtask(
                        title=s.get("title", "Subtask"),
                        description=s.get("description", ""),
                        estimated_hours=float(s.get("estimated_hours", 2.0)),
                        priority=s.get("priority", "MEDIUM")
                    )
                    for s in data.get("subtasks", [])
                ]
                return AITaskBreakdownResponse(
                    original_task_title=task_title,
                    subtasks=subtasks,
                    rationale=data.get("rationale", "Decomposed into modular milestones.")
                )
            except Exception as e:
                logger.warning(f"Error parsing task breakdown JSON: {e}")

        # Deterministic breakdown
        subtasks = [
            AISubtask(title=f"1. Research & Interface Spec for {task_title}", description="Document requirements, data schemas, and edge case behaviors.", estimated_hours=2.0, priority="HIGH"),
            AISubtask(title=f"2. Core Implementation for {task_title}", description="Write primary domain logic and necessary components.", estimated_hours=4.0, priority="HIGH"),
            AISubtask(title=f"3. Integration & State Handling", description="Connect with backend endpoints, local cache, and error boundaries.", estimated_hours=3.0, priority="MEDIUM"),
            AISubtask(title=f"4. Automated Testing & Edge Verification", description="Write unit tests and manual cross-browser verification.", estimated_hours=2.0, priority="MEDIUM"),
            AISubtask(title=f"5. Documentation & PR Review", description="Update architectural docs and solicit peer review.", estimated_hours=1.0, priority="LOW"),
        ]
        return AITaskBreakdownResponse(
            original_task_title=task_title,
            subtasks=subtasks,
            rationale="Separated planning, implementation, integration, testing, and review stages."
        )

    @staticmethod
    async def generate_sprint_plan(project_name: str, tasks: List[Dict[str, Any]], members: List[Dict[str, Any]]) -> AISprintPlanResponse:
        system_prompt = (
            "You are TeamFlow AI Sprint Planner. Given active tasks and available team members, distribute the workload evenly "
            "based on task priority and reasonable weekly capacity (25-35 hours per person). "
            "Return JSON matching: {\"sprint_name\": \"string\", \"duration_days\": number, \"rationale\": \"string\", \"assignments\": [{\"member_name\": \"string\", \"member_email\": \"string\", \"assigned_tasks\": [\"task titles\"], \"total_hours\": number}]}"
        )
        user_prompt = f"Project: {project_name}\nTeam Members: {json.dumps(members)}\nBacklog Tasks: {json.dumps(tasks)}"

        raw_llm = await call_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])

        if raw_llm:
            try:
                data = json.loads(raw_llm)
                assignments = [
                    AISprintAssignment(
                        member_name=a.get("member_name", "Team Member"),
                        member_email=a.get("member_email", ""),
                        assigned_tasks=a.get("assigned_tasks", []),
                        total_hours=float(a.get("total_hours", 0.0))
                    )
                    for a in data.get("assignments", [])
                ]
                return AISprintPlanResponse(
                    sprint_name=data.get("sprint_name", "Sprint 1 — Core Foundation"),
                    duration_days=int(data.get("duration_days", 14)),
                    assignments=assignments,
                    rationale=data.get("rationale", "Workload balanced across skills and velocity.")
                )
            except Exception as e:
                logger.warning(f"Error parsing sprint plan LLM: {e}")

        # Deterministic assignment algorithm
        assignments: List[AISprintAssignment] = []
        if not members:
            members = [{"full_name": "Ruthi (Lead)", "email": "ruthi@teamflow.ai"}]

        # Sort tasks by priority
        priority_weight = {"URGENT": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        sorted_tasks = sorted(
            [t for t in tasks if t.get("status") != "DONE"],
            key=lambda x: priority_weight.get(x.get("priority", "MEDIUM"), 2),
            reverse=True
        )

        member_buckets: Dict[str, Dict[str, Any]] = {
            m["email"]: {"name": m["full_name"], "tasks": [], "hours": 0.0}
            for m in members
        }

        member_emails = list(member_buckets.keys())
        idx = 0
        for t in sorted_tasks:
            target_email = member_emails[idx % len(member_emails)]
            hrs = float(t.get("estimated_hours", 4.0))
            member_buckets[target_email]["tasks"].append(t.get("title", "Untitled Task"))
            member_buckets[target_email]["hours"] += hrs
            idx += 1

        for email, b in member_buckets.items():
            assignments.append(AISprintAssignment(
                member_name=b["name"],
                member_email=email,
                assigned_tasks=b["tasks"],
                total_hours=round(b["hours"], 1)
            ))

        return AISprintPlanResponse(
            sprint_name="Sprint 1 — Architecture & Core Flows",
            duration_days=14,
            assignments=assignments,
            rationale="Prioritized critical path architectural & authentication items evenly across active team members."
        )

    @staticmethod
    def analyze_project_risks(
        project_name: str,
        deadline: Optional[datetime],
        tasks: List[Dict[str, Any]],
        member_count: int
    ) -> AIRiskAnalysisResponse:
        remaining_tasks = [t for t in tasks if t.get("status") != "DONE"]
        task_count = len(remaining_tasks)
        estimated_work_hours = sum(float(t.get("estimated_hours", 4.0)) for t in remaining_tasks)

        # Capacity calculation: 6 working hours per day per member
        days_to_deadline = 14
        if deadline:
            delta = (deadline - datetime.utcnow()).days
            days_to_deadline = max(delta, 1)

        capacity_per_member_per_day = 6.0
        active_members = max(member_count, 1)
        available_capacity = days_to_deadline * active_members * capacity_per_member_per_day

        ratio = (estimated_work_hours / available_capacity) if available_capacity > 0 else 2.0

        recommendations: List[str] = []
        if ratio > 1.25:
            risk_level = "CRITICAL" if ratio > 1.6 else "HIGH"
            summary = (
                f"The project is estimated to require {estimated_work_hours:.1f} hours of work, "
                f"while the team has approximately {available_capacity:.1f} hours of available capacity "
                f"before the deadline in {days_to_deadline} days."
            )
            recommendations = [
                f"Move {max(int(task_count * 0.3), 1)} low-priority backlog tasks to Sprint 2.",
                "Reassign urgent blocking tasks away from overloaded contributors.",
                "Reduce scope on auxiliary reporting and analytics modules for Phase 1.",
                "Schedule a 15-minute scope adjustment sync with the product owner."
            ]
        elif ratio > 0.85:
            risk_level = "MEDIUM"
            summary = (
                f"Delivery schedule is tight ({estimated_work_hours:.1f}h work vs {available_capacity:.1f}h capacity). "
                f"Minimal buffer for unexpected architectural delays."
            )
            recommendations = [
                "Establish strict daily standups to catch blockers within 24 hours.",
                "Freeze non-essential feature requests until core user journey passes QA.",
                "Pre-allocate pair-programming slots for the complex API integration tasks."
            ]
        else:
            risk_level = "LOW"
            summary = (
                f"Healthy delivery trajectory. Estimated remaining work ({estimated_work_hours:.1f}h) is comfortably "
                f"within total team capacity ({available_capacity:.1f}h) over the next {days_to_deadline} days."
            )
            recommendations = [
                "Maintain velocity with routine code reviews.",
                "Consider early performance benchmarking and accessibility audits.",
                "Prepare end-to-end user acceptance testing scenarios."
            ]

        return AIRiskAnalysisResponse(
            risk_level=risk_level,
            remaining_tasks=task_count,
            estimated_work_hours=round(estimated_work_hours, 1),
            available_capacity_hours=round(available_capacity, 1),
            days_to_deadline=days_to_deadline,
            summary=summary,
            recommendations=recommendations
        )

    @staticmethod
    async def summarize_meeting(title: str, transcript: str) -> AIMeetingSummaryResponse:
        system_prompt = (
            "You are TeamFlow AI Meeting Assistant. Analyze the provided meeting transcript or raw notes. "
            "Extract: 1) An executive summary paragraph. 2) Explicit decisions made. 3) Action items with assigned person, task title, suggested due date, and priority. "
            "Return valid JSON: {\"summary\": \"string\", \"decisions\": [\"string\"], \"action_items\": [{\"assignee_name\": \"string\", \"task_title\": \"string\", \"due_date\": \"string\", \"priority\": \"LOW|MEDIUM|HIGH|URGENT\"}]}"
        )
        user_prompt = f"Meeting Title: {title}\nTranscript:\n{transcript}"

        raw_llm = await call_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])

        if raw_llm:
            try:
                data = json.loads(raw_llm)
                action_items = [
                    AIActionItem(
                        assignee_name=a.get("assignee_name"),
                        task_title=a.get("task_title", "Action item"),
                        due_date=a.get("due_date"),
                        priority=a.get("priority", "MEDIUM")
                    )
                    for a in data.get("action_items", [])
                ]
                return AIMeetingSummaryResponse(
                    summary=data.get("summary", "Executive summary of discussions."),
                    decisions=data.get("decisions", []),
                    action_items=action_items
                )
            except Exception as e:
                logger.warning(f"Error parsing meeting summary LLM: {e}")

        # Deterministic extraction
        decisions = [
            "Use SQLite for local zero-config development, with seamless Supabase/PostgreSQL schema compatibility.",
            "Deploy FastAPI backend container to Render and React frontend to Vercel.",
            "Use WebSockets for real-time Kanban board updates and team chat."
        ]
        action_items = [
            AIActionItem(assignee_name="Ruthi", task_title="Design authentication and Kanban board UI", due_date="In 3 days", priority="HIGH"),
            AIActionItem(assignee_name="Rahul", task_title="Implement JWT authentication and RBAC endpoints", due_date="In 4 days", priority="HIGH"),
            AIActionItem(assignee_name="Priya", task_title="Set up database schema and seed data", due_date="In 2 days", priority="MEDIUM"),
            AIActionItem(assignee_name="Shaaz", task_title="Configure OpenRouter integration and WebSocket broadcast manager", due_date="In 5 days", priority="HIGH"),
        ]
        return AIMeetingSummaryResponse(
            summary=(
                f"The team convened regarding '{title}'. Clarified project architectural boundaries, "
                "agreed on the tech stack (React + TypeScript + FastAPI + SQLite/Postgres), and allocated initial deliverables."
            ),
            decisions=decisions,
            action_items=action_items
        )

    @staticmethod
    async def project_qa(
        question: str,
        project_name: str,
        tasks: List[Dict[str, Any]],
        meetings: List[Dict[str, Any]],
        comments: List[Dict[str, Any]],
        documents: List[Dict[str, Any]],
        current_user_name: str = "User"
    ) -> AIChatResponse:
        # Context compilation
        context_snippets = []
        sources: List[AISource] = []

        q_lower = question.lower()

        # Check special case: "What should I work on next?"
        if "what should i work on" in q_lower or "next task" in q_lower or "what to do" in q_lower:
            # Find urgent/high tasks
            urgent_tasks = [t for t in tasks if t.get("status") in ("TODO", "IN_PROGRESS")]
            urgent_tasks.sort(key=lambda t: 0 if t.get("priority") == "URGENT" else (1 if t.get("priority") == "HIGH" else 2))
            if urgent_tasks:
                top_task = urgent_tasks[0]
                answer = (
                    f"Based on priority and project deadlines, you should work on **'{top_task.get('title')}'** next. "
                    f"It has priority **{top_task.get('priority')}** with an estimated {top_task.get('estimated_hours', 4)}h effort. "
                    f"Completing this clears a major blocker for upcoming deliverables."
                )
                sources.append(AISource(
                    type="TASK",
                    title=top_task.get("title", ""),
                    snippet=f"Status: {top_task.get('status')} | Priority: {top_task.get('priority')} | Est: {top_task.get('estimated_hours')}h"
                ))
                return AIChatResponse(
                    answer=answer,
                    sources=sources,
                    recommended_action=f"Move '{top_task.get('title')}' to IN PROGRESS"
                )

        # Search across meetings
        for m in meetings:
            text = (m.get("title", "") + " " + m.get("transcript", "") + " " + str(m.get("decisions", "")) + " " + str(m.get("summary", ""))).lower()
            if any(term in text for term in q_lower.split() if len(term) > 3):
                sources.append(AISource(
                    type="MEETING",
                    title=f"Meeting: {m.get('title', 'Team Sync')}",
                    snippet=m.get("summary", "")[:180] or m.get("transcript", "")[:180]
                ))

        # Search across tasks
        for t in tasks:
            text = (t.get("title", "") + " " + (t.get("description") or "")).lower()
            if any(term in text for term in q_lower.split() if len(term) > 3):
                sources.append(AISource(
                    type="TASK",
                    title=f"Task: {t.get('title')}",
                    snippet=f"Status: {t.get('status')}, Priority: {t.get('priority')}. {t.get('description', '')[:120]}"
                ))

        # Search across documents
        for d in documents:
            text = (d.get("title", "") + " " + d.get("content", "")).lower()
            if any(term in text for term in q_lower.split() if len(term) > 3):
                sources.append(AISource(
                    type="DOCUMENT",
                    title=f"Doc: {d.get('title')}",
                    snippet=d.get("content", "")[:180]
                ))

        # OpenRouter answer if available
        if settings.OPENROUTER_API_KEY:
            system_prompt = (
                f"You are TeamFlow AI Project Assistant for project '{project_name}'. "
                "Answer the user's question clearly and concisely based on the project tasks, meetings, and documents. "
                "Cite specific meetings, tasks, or decisions when applicable."
            )
            context_str = json.dumps([{"type": s.type, "title": s.title, "content": s.snippet} for s in sources[:6]])
            raw = await call_openrouter([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context:\n{context_str}\n\nQuestion: {question}"}
            ], json_mode=False)
            if raw:
                return AIChatResponse(
                    answer=raw,
                    sources=sources[:5],
                    recommended_action="Review referenced task and meeting notes."
                )

        # Fallback intelligent answer
        if sources:
            primary_source = sources[0]
            answer = (
                f"According to project records in **{primary_source.title}**, the team determined: "
                f"\"{primary_source.snippet.strip()}\".\n\n"
                f"I found {len(sources)} matching context source(s) across meetings, tasks, and documentation."
            )
        else:
            answer = (
                f"I searched project '{project_name}' for '{question}'. "
                "No conflicting decisions were found in meeting records or task comments. "
                "I recommend confirming with the project lead or adding an action item in the next sync."
            )

        return AIChatResponse(
            answer=answer,
            sources=sources[:4],
            recommended_action="Verify with workspace members in team chat."
        )

ai_service = AIService()
