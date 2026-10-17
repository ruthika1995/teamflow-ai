from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.models import Task, Project, User, Comment, Notification, WorkspaceMember
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskMove, TaskOut, TaskDetailOut, CommentCreate, CommentOut
from app.core.security import get_current_user, check_workspace_permission
from app.websocket.manager import manager

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def enrich_task_out(t: Task) -> TaskOut:
    return TaskOut(
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
        assignee=t.assignee,
        comments_count=len(t.comments) if t.comments else 0
    )

@router.get("", response_model=List[TaskOut])
def list_tasks(
    project_id: str,
    status: Optional[str] = None,
    assignee_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    query = db.query(Task).filter(Task.project_id == project_id).options(
        joinedload(Task.assignee),
        joinedload(Task.comments)
    )
    if status:
        query = query.filter(Task.status == status)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)

    tasks = query.order_by(Task.position.asc(), Task.created_at.desc()).all()
    return [enrich_task_out(t) for t in tasks]

@router.post("", response_model=TaskOut)
async def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == task_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # RBAC: Only OWNER, ADMIN, MEMBER can create tasks
    check_workspace_permission(project.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER"], db)

    task = Task(
        project_id=task_in.project_id,
        assignee_id=task_in.assignee_id,
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        priority=task_in.priority,
        deadline=task_in.deadline,
        estimated_hours=task_in.estimated_hours,
        actual_hours=task_in.actual_hours,
        labels=task_in.labels or ""
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # If assigned to someone other than creator, trigger notification
    if task.assignee_id and task.assignee_id != current_user.id:
        notif = Notification(
            user_id=task.assignee_id,
            type="ASSIGNMENT",
            title="New Task Assignment",
            content=f"{current_user.full_name} assigned you '{task.title}' on {project.name}.",
            link_url=f"/projects/{project.id}"
        )
        db.add(notif)
        db.commit()

    task_loaded = db.query(Task).filter(Task.id == task.id).options(
        joinedload(Task.assignee),
        joinedload(Task.comments)
    ).first()

    # Real-time WebSocket broadcast to all members of this workspace
    out = enrich_task_out(task_loaded)
    await manager.broadcast_to_workspace(
        project.workspace_id,
        "TASK_CREATED",
        out.model_dump(mode="json")
    )
    return out

@router.get("/{task_id}", response_model=TaskDetailOut)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    t = db.query(Task).filter(Task.id == task_id).options(
        joinedload(Task.assignee),
        joinedload(Task.comments).joinedload(Comment.user)
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    comments_out = [
        CommentOut(
            id=c.id,
            task_id=c.task_id,
            user_id=c.user_id,
            content=c.content,
            created_at=c.created_at,
            user=c.user
        )
        for c in sorted(t.comments, key=lambda x: x.created_at)
    ]

    return TaskDetailOut(
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
        assignee=t.assignee,
        comments_count=len(comments_out),
        comments=comments_out
    )

@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    project = db.query(Project).filter(Project.id == t.project_id).first()
    check_workspace_permission(project.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER"], db)

    old_assignee = t.assignee_id
    if task_in.title is not None:
        t.title = task_in.title
    if task_in.description is not None:
        t.description = task_in.description
    if task_in.status is not None:
        t.status = task_in.status
    if task_in.priority is not None:
        t.priority = task_in.priority
    if task_in.assignee_id is not None:
        t.assignee_id = task_in.assignee_id
    if task_in.deadline is not None:
        t.deadline = task_in.deadline
    if task_in.estimated_hours is not None:
        t.estimated_hours = task_in.estimated_hours
    if task_in.actual_hours is not None:
        t.actual_hours = task_in.actual_hours
    if task_in.labels is not None:
        t.labels = task_in.labels
    if task_in.position is not None:
        t.position = task_in.position

    db.commit()
    db.refresh(t)

    # Check new assignment notification
    if task_in.assignee_id and task_in.assignee_id != old_assignee and task_in.assignee_id != current_user.id:
        notif = Notification(
            user_id=task_in.assignee_id,
            type="ASSIGNMENT",
            title="Task Assigned to You",
            content=f"{current_user.full_name} assigned you to '{t.title}'.",
            link_url=f"/projects/{project.id}"
        )
        db.add(notif)
        db.commit()

    t_loaded = db.query(Task).filter(Task.id == t.id).options(
        joinedload(Task.assignee),
        joinedload(Task.comments)
    ).first()

    out = enrich_task_out(t_loaded)
    await manager.broadcast_to_workspace(
        project.workspace_id,
        "TASK_UPDATED",
        out.model_dump(mode="json")
    )
    return out

@router.patch("/{task_id}/move", response_model=TaskOut)
async def move_task(
    task_id: str,
    move_in: TaskMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    project = db.query(Project).filter(Project.id == t.project_id).first()
    check_workspace_permission(project.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER"], db)

    t.status = move_in.status
    if move_in.position is not None:
        t.position = move_in.position

    db.commit()
    db.refresh(t)

    t_loaded = db.query(Task).filter(Task.id == t.id).options(
        joinedload(Task.assignee),
        joinedload(Task.comments)
    ).first()

    out = enrich_task_out(t_loaded)
    # Broadcast status change across the workspace
    await manager.broadcast_to_workspace(
        project.workspace_id,
        "TASK_MOVED",
        out.model_dump(mode="json")
    )
    return out

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    project = db.query(Project).filter(Project.id == t.project_id).first()
    check_workspace_permission(project.workspace_id, current_user.id, ["OWNER", "ADMIN"], db)

    workspace_id = project.workspace_id
    deleted_id = t.id
    db.delete(t)
    db.commit()

    await manager.broadcast_to_workspace(
        workspace_id,
        "TASK_DELETED",
        {"id": deleted_id, "project_id": project.id}
    )
    return {"message": "Task deleted"}

@router.post("/{task_id}/comments", response_model=CommentOut)
async def add_comment(
    task_id: str,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    project = db.query(Project).filter(Project.id == t.project_id).first()
    check_workspace_permission(project.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER", "VIEWER"], db)

    comment = Comment(
        task_id=task_id,
        user_id=current_user.id,
        content=comment_in.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # If assignee is someone else, notify them
    if t.assignee_id and t.assignee_id != current_user.id:
        notif = Notification(
            user_id=t.assignee_id,
            type="MENTION",
            title="New Comment on Your Task",
            content=f"{current_user.full_name} commented on '{t.title}': \"{comment.content[:80]}\"",
            link_url=f"/projects/{project.id}"
        )
        db.add(notif)
        db.commit()

    c_loaded = db.query(Comment).filter(Comment.id == comment.id).options(joinedload(Comment.user)).first()
    out = CommentOut(
        id=c_loaded.id,
        task_id=c_loaded.task_id,
        user_id=c_loaded.user_id,
        content=c_loaded.content,
        created_at=c_loaded.created_at,
        user=c_loaded.user
    )

    await manager.broadcast_to_workspace(
        project.workspace_id,
        "NEW_COMMENT",
        out.model_dump(mode="json")
    )
    return out
