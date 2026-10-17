from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import Project, Task, User, WorkspaceMember
from app.schemas.schemas import ProjectCreate, ProjectUpdate, ProjectOut
from app.core.security import get_current_user, check_workspace_permission

router = APIRouter(prefix="/projects", tags=["Projects"])

def enrich_project(p: Project, db: Session) -> ProjectOut:
    tasks = db.query(Task).filter(Task.project_id == p.id).all()
    total = len(tasks)
    completed = len([t for t in tasks if t.status == "DONE"])
    pct = int((completed / total * 100)) if total > 0 else 0
    return ProjectOut(
        id=p.id,
        workspace_id=p.workspace_id,
        name=p.name,
        description=p.description,
        deadline=p.deadline,
        created_at=p.created_at,
        task_count=total,
        completed_task_count=completed,
        progress_percentage=pct
    )

@router.get("", response_model=List[ProjectOut])
def list_projects(
    workspace_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Project)
    if workspace_id:
        query = query.filter(Project.workspace_id == workspace_id)
    projects = query.all()
    return [enrich_project(p, db) for p in projects]

@router.post("", response_model=ProjectOut)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # RBAC: OWNER, ADMIN, or MEMBER can create projects (VIEWER cannot)
    check_workspace_permission(project_in.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER"], db)

    project = Project(
        workspace_id=project_in.workspace_id,
        name=project_in.name,
        description=project_in.description,
        deadline=project_in.deadline
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return enrich_project(project, db)

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return enrich_project(p, db)

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    update_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    check_workspace_permission(p.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER"], db)

    if update_in.name is not None:
        p.name = update_in.name
    if update_in.description is not None:
        p.description = update_in.description
    if update_in.deadline is not None:
        p.deadline = update_in.deadline

    db.commit()
    db.refresh(p)
    return enrich_project(p, db)

@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    check_workspace_permission(p.workspace_id, current_user.id, ["OWNER", "ADMIN"], db)
    db.delete(p)
    db.commit()
    return {"message": "Project deleted successfully"}
