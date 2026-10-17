from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.models import Message, Workspace, User
from app.schemas.schemas import MessageCreate, MessageOut
from app.core.security import get_current_user, check_workspace_permission
from app.websocket.manager import manager

router = APIRouter(prefix="/chat", tags=["Team Chat"])

@router.get("/messages", response_model=List[MessageOut])
def list_messages(
    workspace_id: str,
    project_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_workspace_permission(workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER", "VIEWER"], db)

    query = db.query(Message).filter(Message.workspace_id == workspace_id)
    if project_id:
        query = query.filter(Message.project_id == project_id)

    messages = query.options(joinedload(Message.user)).order_by(Message.created_at.asc()).limit(limit).all()
    return messages

@router.post("/messages", response_model=MessageOut)
async def send_message(
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_workspace_permission(message_in.workspace_id, current_user.id, ["OWNER", "ADMIN", "MEMBER"], db)

    msg = Message(
        workspace_id=message_in.workspace_id,
        project_id=message_in.project_id,
        user_id=current_user.id,
        content=message_in.content,
        is_ai=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    loaded = db.query(Message).filter(Message.id == msg.id).options(joinedload(Message.user)).first()
    out = MessageOut(
        id=loaded.id,
        workspace_id=loaded.workspace_id,
        project_id=loaded.project_id,
        user_id=loaded.user_id,
        content=loaded.content,
        is_ai=loaded.is_ai,
        created_at=loaded.created_at,
        user=loaded.user
    )

    # Broadcast live chat message to everyone in the workspace
    await manager.broadcast_to_workspace(
        message_in.workspace_id,
        "NEW_CHAT_MESSAGE",
        out.model_dump(mode="json")
    )
    return out
