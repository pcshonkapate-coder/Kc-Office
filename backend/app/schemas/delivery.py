from typing import List, Optional, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict


# --- Shared Base Schemas ---

class ClientVisibilityMixin(BaseModel):
    client_visible: bool = Field(default=False, description="True if visible to client via portal")


# --- Delivery Comments ---

class DeliveryCommentBase(ClientVisibilityMixin):
    comment_text: str
    entity_type: str
    entity_id: str


class DeliveryCommentCreate(DeliveryCommentBase):
    pass


class DeliveryCommentResponse(DeliveryCommentBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Subtasks ---

class SubtaskBase(BaseModel):
    title: str
    is_completed: bool = False
    assigned_to_user_id: Optional[str] = None


class SubtaskCreate(SubtaskBase):
    parent_task_id: str


class SubtaskResponse(SubtaskBase):
    id: str
    parent_task_id: str

    model_config = ConfigDict(from_attributes=True)


# --- Tasks ---

class TaskBase(ClientVisibilityMixin):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    status: str = "TODO"
    board_order: int = 0
    due_date: Optional[date] = None
    estimated_hours: Optional[float] = None
    actual_hours: float = 0.0
    assigned_to_user_id: Optional[str] = None
    reviewer_id: Optional[str] = None
    tags: Optional[List[str]] = None


class TaskCreate(TaskBase):
    project_id: str
    milestone_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    board_order: Optional[int] = None
    due_date: Optional[date] = None
    assigned_to_user_id: Optional[str] = None


class TaskResponse(TaskBase):
    id: str
    project_id: str
    milestone_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubtaskResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Milestones ---

class MilestoneBase(ClientVisibilityMixin):
    title: str
    start_date: Optional[date] = None
    due_date: date
    deliverable_summary: Optional[str] = None
    amount: float = 0.0
    status: str = "pending"
    completion_percentage: int = 0


class MilestoneCreate(MilestoneBase):
    project_id: str


class MilestoneResponse(MilestoneBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime
    tasks: List[TaskResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Projects ---

class ProjectBase(BaseModel):
    project_code: str
    name: str
    description: Optional[str] = None
    project_type: str = "fixed_bid"
    status: str = "PLANNING"
    priority: str = "medium"
    budget: float = 0.0
    currency: str = "INR"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project_manager_id: Optional[str] = None
    company_id: str
    deal_id: Optional[str] = None
    contract_id: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime
    milestones: List[MilestoneResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Kanban & Drag/Drop ---

class KanbanMoveRequest(BaseModel):
    new_status: str
    new_board_order: int
