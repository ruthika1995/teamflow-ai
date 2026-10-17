from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.models import Project, Task, User, Meeting, Comment, Document, WorkspaceMember, Notification
from app.schemas.schemas import (
    AIProjectPlanRequest, AIProjectPlanResponse,
    AIBulkCreateTasksRequest,
    AITaskBreakdownRequest, AITaskBreakdownResponse,
    AISprintPlanRequest, AISprintPlanResponse,
    AIRiskAnalysisRequest, AIRiskAnalysisResponse,
    AIMeetingSummarizeRequest, AIMeetingSummaryResponse,
    AIChatRequest, AIChatResponse,
    TaskOut
)
from app.core.security import get_current_user, check_workspace_permission
from app.ai.service import ai_service
from app.websocket.manager import manager

router = APIRouter(prefix="/ai", tags=["AI Copilot & Workflows"])

@router.post("/project-plan", response_model=AIProjectPlanResponse)
async def generate_project_plan(
    req: AIProjectPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    check_workspace_permission(project.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER"], db)
    return await ai_service.generate_project_plan(req.prompt, project.name)

@router.post("/bulk-create-tasks", response_model=List[TaskOut])
async def bulk_create_tasks(
    req: AIBulkCreateTasksRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    check_workspace_permission(project.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER"], db)

    created_tasks = []
    current_count = db.query(Task).filter(Task.project_id == req.project_id).count()

    for idx, t in enumerate(req.tasks):
        new_task = Task(
            project_id=req.project_id,
            title=t.title,
            description=t.description,
            priority=t.priority,
            estimated_hours=t.estimated_hours,
            status="TODO",
            position=current_count + idx,
            labels=t.suggested_role or "AI Plan"
        )
        db.add(new_task)
        created_tasks.append(new_task)

    db.commit()

    # Re-fetch with relations
    results = []
    for t in created_tasks:
        db.refresh(t)
        out = TaskOut(
            id=t.id,
            project_id=t.project_id,
            assignee_id=t.assignee_id,
            title=t.title,
            description=t.description,
            status=t.status,
            priority=t.priority,
            deadline=t.deadline,
            estimated_hours=t.estimated_hours,
            actual_hours=t.actual_hours,
            labels=t.labels or "",
            position=t.position or 0,
            created_at=t.created_at,
            updated_at=t.updated_at,
            assignee=None,
            comments_count=0
        )
        results.append(out)

    # Broadcast task creation to workspace
    await manager.broadcast_to_workspace(
        project.workspace_id,
        "TASKS_BULK_CREATED",
        {"project_id": project.id, "count": len(results)}
    )

    return results

@router.post("/task-breakdown", response_model=AITaskBreakdownResponse)
async def breakdown_task(
    req: AITaskBreakdownRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == req.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return await ai_service.breakdown_task(task.title, task.description)

@router.post("/sprint-plan", response_model=AISprintPlanResponse)
async def generate_sprint_plan(
    req: AISprintPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = db.query(Task).filter(Task.project_id == req.project_id).all()
    tasks_dict = [
        {"id": t.id, "title": t.title, "priority": t.priority, "status": t.status, "estimated_hours": t.estimated_hours}
        for t in tasks
    ]

    memberships = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == project.workspace_id
    ).options(joinedload(WorkspaceMember.user)).all()

    members_dict = [
        {"id": m.user.id, "full_name": m.user.full_name, "email": m.user.email, "role": m.role}
        for m in memberships if m.user
    ]

    return await ai_service.generate_sprint_plan(project.name, tasks_dict, members_dict)

@router.post("/risk-analysis", response_model=AIRiskAnalysisResponse)
def analyze_risk(
    req: AIRiskAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = db.query(Task).filter(Task.project_id == req.project_id).all()
    tasks_dict = [
        {"id": t.id, "title": t.title, "status": t.status, "estimated_hours": t.estimated_hours, "priority": t.priority}
        for t in tasks
    ]

    member_count = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == project.workspace_id).count()

    return ai_service.analyze_project_risks(project.name, project.deadline, tasks_dict, member_count)

@router.post("/meeting-summary", response_model=AIMeetingSummaryResponse)
async def summarize_meeting_text(
    req: AIMeetingSummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await ai_service.summarize_meeting(req.title, req.transcript)

@router.post("/chat", response_model=AIChatResponse)
async def project_copilot_chat(
    req: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = db.query(Task).filter(Task.project_id == req.project_id).all()
    tasks_data = [
        {"title": t.title, "description": t.description, "status": t.status, "priority": t.priority, "estimated_hours": t.estimated_hours}
        for t in tasks
    ]

    meetings = db.query(Meeting).filter(Meeting.project_id == req.project_id).all()
    meetings_data = [
        {"title": m.title, "transcript": m.transcript, "summary": m.summary, "decisions": m.decisions}
        for m in meetings
    ]

    docs = db.query(Document).filter(Document.project_id == req.project_id).all()
    docs_data = [{"title": d.title, "content": d.content} for d in docs]

    comments = db.query(Comment).join(Task).filter(Task.project_id == req.project_id).all()
    comments_data = [{"content": c.content} for c in comments]

    return await ai_service.project_qa(
        question=req.question,
        project_name=project.name,
        tasks=tasks_data,
        meetings=meetings_data,
        comments=comments_data,
        documents=docs_data,
        current_user_name=current_user.full_name
    )
