from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# ── Auth & Users ──
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


# ── Workspaces & Members ──
class WorkspaceMemberOut(BaseModel):
    id: str
    user_id: str
    role: str
    joined_at: datetime
    user: UserOut

    class Config:
        from_attributes = True

class WorkspaceMemberAdd(BaseModel):
    email: EmailStr
    role: str = "MEMBER"  # OWNER, ADMIN, MEMBER, VIEWER

class WorkspaceBase(BaseModel):
    name: str

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceOut(WorkspaceBase):
    id: str
    slug: str
    owner_id: str
    created_at: datetime
    members: List[WorkspaceMemberOut] = []

    class Config:
        from_attributes = True


# ── Projects ──
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    workspace_id: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None

class ProjectOut(ProjectBase):
    id: str
    workspace_id: str
    created_at: datetime
    task_count: int = 0
    completed_task_count: int = 0
    progress_percentage: int = 0

    class Config:
        from_attributes = True


# ── Comments ──
class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: str
    task_id: str
    user_id: str
    content: str
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ── Tasks ──
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "TODO"  # TODO, IN_PROGRESS, IN_REVIEW, DONE
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH, URGENT
    assignee_id: Optional[str] = None
    deadline: Optional[datetime] = None
    estimated_hours: float = 4.0
    actual_hours: float = 0.0
    labels: Optional[str] = ""

class TaskCreate(TaskBase):
    project_id: str

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    deadline: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    labels: Optional[str] = None
    position: Optional[int] = None

class TaskMove(BaseModel):
    status: str
    position: Optional[int] = 0

class TaskOut(TaskBase):
    id: str
    project_id: str
    position: int
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserOut] = None
    comments_count: int = 0

    class Config:
        from_attributes = True

class TaskDetailOut(TaskOut):
    comments: List[CommentOut] = []


# ── Team Chat Messages ──
class MessageCreate(BaseModel):
    content: str
    workspace_id: str
    project_id: Optional[str] = None

class MessageOut(BaseModel):
    id: str
    workspace_id: str
    project_id: Optional[str] = None
    user_id: str
    content: str
    is_ai: bool = False
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ── Meetings ──
class MeetingCreate(BaseModel):
    project_id: str
    title: str
    transcript: str

class MeetingOut(BaseModel):
    id: str
    project_id: str
    title: str
    transcript: str
    summary: Optional[str] = None
    action_items: Optional[str] = None  # JSON string
    decisions: Optional[str] = None     # JSON string
    created_at: datetime

    class Config:
        from_attributes = True


# ── Documents ──
class DocumentCreate(BaseModel):
    project_id: str
    title: str
    content: str
    filename: Optional[str] = None

class DocumentOut(BaseModel):
    id: str
    project_id: str
    title: str
    content: str
    filename: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Notifications ──
class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    content: str
    read: bool
    link_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── AI Schemas ──
class AIPlanTask(BaseModel):
    title: str
    description: str
    priority: str = "MEDIUM"
    estimated_hours: float = 4.0
    suggested_role: Optional[str] = "Frontend / Backend"

class AIPlanMilestone(BaseModel):
    milestone_name: str
    tasks: List[AIPlanTask]

class AIProjectPlanRequest(BaseModel):
    project_id: str
    prompt: str  # e.g. "We need to build an e-commerce website with React and FastAPI"

class AIProjectPlanResponse(BaseModel):
    plan_title: str
    summary: str
    milestones: List[AIPlanMilestone]
    total_estimated_hours: float

class AIBulkCreateTasksRequest(BaseModel):
    project_id: str
    tasks: List[AIPlanTask]

class AITaskBreakdownRequest(BaseModel):
    task_id: str

class AISubtask(BaseModel):
    title: str
    description: str
    estimated_hours: float
    priority: str

class AITaskBreakdownResponse(BaseModel):
    original_task_title: str
    subtasks: List[AISubtask]
    rationale: str

class AISprintPlanRequest(BaseModel):
    project_id: str

class AISprintAssignment(BaseModel):
    member_name: str
    member_email: str
    assigned_tasks: List[str]  # task titles
    total_hours: float

class AISprintPlanResponse(BaseModel):
    sprint_name: str
    duration_days: int
    assignments: List[AISprintAssignment]
    rationale: str

class AIRiskAnalysisRequest(BaseModel):
    project_id: str

class AIRiskRecommendation(BaseModel):
    action: str
    impact: str

class AIRiskAnalysisResponse(BaseModel):
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    remaining_tasks: int
    estimated_work_hours: float
    available_capacity_hours: float
    days_to_deadline: int
    summary: str
    recommendations: List[str]

class AIMeetingSummarizeRequest(BaseModel):
    project_id: str
    title: str
    transcript: str

class AIActionItem(BaseModel):
    assignee_name: Optional[str] = None
    task_title: str
    due_date: Optional[str] = None
    priority: str = "MEDIUM"

class AIMeetingSummaryResponse(BaseModel):
    summary: str
    decisions: List[str]
    action_items: List[AIActionItem]

class AIChatRequest(BaseModel):
    project_id: str
    question: str  # e.g. "What should I work on next?" or "What did we decide about authentication?"

class AISource(BaseModel):
    type: str  # "TASK", "MEETING", "COMMENT", "DOCUMENT"
    title: str
    snippet: str

class AIChatResponse(BaseModel):
    answer: str
    sources: List[AISource] = []
    recommended_action: Optional[str] = None
