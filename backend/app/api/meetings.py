import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import Meeting, Project, User
from app.schemas.schemas import MeetingCreate, MeetingOut
from app.core.security import get_current_user, check_workspace_permission
from app.ai.service import ai_service

router = APIRouter(prefix="/meetings", tags=["Meetings"])

@router.get("", response_model=List[MeetingOut])
def list_meetings(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    check_workspace_permission(project.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER", "VIEWER"], db)
    return db.query(Meeting).filter(Meeting.project_id == project_id).order_by(Meeting.created_at.desc()).all()

@router.post("", response_model=MeetingOut)
async def create_and_summarize_meeting(
    meeting_in: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == meeting_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    check_workspace_permission(project.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER"], db)

    # Automatically summarize transcript
    summary_res = await ai_service.summarize_meeting(meeting_in.title, meeting_in.transcript)

    meeting = Meeting(
        project_id=meeting_in.project_id,
        title=meeting_in.title,
        transcript=meeting_in.transcript,
        summary=summary_res.summary,
        decisions=json.dumps(summary_res.decisions),
        action_items=json.dumps([a.model_dump() for a in summary_res.action_items])
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting
