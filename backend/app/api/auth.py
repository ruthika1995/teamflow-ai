from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User, Workspace, WorkspaceMember
from app.schemas.schemas import UserCreate, UserLogin, UserOut, Token
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        password_hash=hashed_pw,
        avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={user_in.full_name}"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically create a default workspace for the user
    default_ws = Workspace(
        name=f"{user.full_name.split()[0]}'s Workspace",
        slug=f"{user.full_name.split()[0].lower()}-workspace",
        owner_id=user.id
    )
    db.add(default_ws)
    db.commit()
    db.refresh(default_ws)

    member = WorkspaceMember(workspace_id=default_ws.id, user_id=user.id, role="OWNER")
    db.add(member)
    db.commit()

    token = create_access_token(data={"sub": user.id, "email": user.email})
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(data={"sub": user.id, "email": user.email})
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-users", response_model=List[UserOut])
def list_demo_users(db: Session = Depends(get_db)):
    """List pre-seeded demo users for one-click switching during evaluation"""
    users = db.query(User).all()
    return users

@router.post("/switch-user/{user_id}", response_model=Token)
def switch_user(user_id: str, db: Session = Depends(get_db)):
    """Quick switch user identity for demoing RBAC roles without logging out"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = create_access_token(data={"sub": user.id, "email": user.email})
    return Token(access_token=token, user=UserOut.model_validate(user))
