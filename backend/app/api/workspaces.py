from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.models import Workspace, WorkspaceMember, User
from app.schemas.schemas import WorkspaceCreate, WorkspaceOut, WorkspaceMemberAdd, WorkspaceMemberOut
from app.core.security import get_current_user, check_workspace_permission

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.get("", response_model=List[WorkspaceOut])
def list_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find all workspaces the current user belongs to
    memberships = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.id).all()
    workspace_ids = [m.workspace_id for m in memberships]
    
    # If empty (e.g. freshly seeded), fallback to all workspaces for demo simplicity
    if not workspace_ids:
        workspaces = db.query(Workspace).options(joinedload(Workspace.members).joinedload(WorkspaceMember.user)).all()
        return workspaces

    workspaces = db.query(Workspace).filter(Workspace.id.in_(workspace_ids)).options(
        joinedload(Workspace.members).joinedload(WorkspaceMember.user)
    ).all()
    return workspaces

@router.post("", response_model=WorkspaceOut)
def create_workspace(
    ws_in: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    slug = ws_in.name.lower().replace(" ", "-")
    ws = Workspace(name=ws_in.name, slug=slug, owner_id=current_user.id)
    db.add(ws)
    db.commit()
    db.refresh(ws)

    # Add creator as OWNER
    member = WorkspaceMember(workspace_id=ws.id, user_id=current_user.id, role="OWNER")
    db.add(member)
    db.commit()

    return db.query(Workspace).filter(Workspace.id == ws.id).options(
        joinedload(Workspace.members).joinedload(WorkspaceMember.user)
    ).first()

@router.get("/{workspace_id}", response_model=WorkspaceOut)
def get_workspace(
    workspace_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).options(
        joinedload(Workspace.members).joinedload(WorkspaceMember.user)
    ).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws

@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberOut])
def get_members(
    workspace_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    members = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).options(joinedload(WorkspaceMember.user)).all()
    return members

@router.post("/{workspace_id}/members", response_model=WorkspaceMemberOut)
def add_member(
    workspace_id: str,
    member_in: WorkspaceMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # RBAC: Only OWNER or ADMIN can invite/add members
    check_workspace_permission(workspace_id, current_user.id, ["OWNER", "ADMIN"], db)

    target_user = db.query(User).filter(User.email == member_in.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"No user found with email {member_in.email}")

    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == target_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this workspace")

    new_member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=target_user.id,
        role=member_in.role
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return db.query(WorkspaceMember).filter(WorkspaceMember.id == new_member.id).options(
        joinedload(WorkspaceMember.user)
    ).first()
