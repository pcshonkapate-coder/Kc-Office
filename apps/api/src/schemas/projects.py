from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


# Milestone Schemas
class MilestoneCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    billing_percentage: Decimal = Decimal("0.00")
    due_date: date
    status: str = Field("PENDING", examples=["PENDING", "IN_PROGRESS", "REACHED", "INVOICED"])


class MilestoneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    description: Optional[str] = None
    billing_percentage: Decimal
    due_date: date
    status: str
    created_at: datetime


# Sprint Schemas
class SprintCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    goal: Optional[str] = None
    start_date: date
    end_date: date
    status: str = Field("PLANNING", examples=["PLANNING", "ACTIVE", "COMPLETED"])


class SprintRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    goal: Optional[str] = None
    start_date: date
    end_date: date
    status: str


# Task Details: Subtasks, Checklists, Comments, Time Entries
class SubtaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class SubtaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    title: str
    is_completed: bool


class ChecklistItemCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=255)


class ChecklistItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    content: str
    is_checked: bool


class TaskCommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    mentions: List[str] = []


class TaskCommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID
    content: str
    mentions: List[str]
    created_at: datetime
    author_name: Optional[str] = None


class TimeEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: int
    is_running: bool
    description: Optional[str] = None
    user_name: Optional[str] = None


class TaskCreate(BaseModel):
    project_id: uuid.UUID
    sprint_id: Optional[uuid.UUID] = None
    milestone_id: Optional[uuid.UUID] = None
    assignee_id: Optional[uuid.UUID] = None
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    status: str = Field("TODO", examples=["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
    priority: str = Field("MEDIUM", examples=["LOW", "MEDIUM", "HIGH", "URGENT"])
    estimated_hours: Decimal = Decimal("0.00")
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[uuid.UUID] = None
    estimated_hours: Optional[Decimal] = None
    due_date: Optional[date] = None


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    sprint_id: Optional[uuid.UUID] = None
    milestone_id: Optional[uuid.UUID] = None
    assignee_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    estimated_hours: Decimal
    due_date: Optional[date] = None
    created_at: datetime
    assignee_name: Optional[str] = None
    project_name: Optional[str] = None
    subtasks: List[SubtaskRead] = []
    checklist_items: List[ChecklistItemRead] = []


# Project Schemas
class ProjectCreate(BaseModel):
    account_id: Optional[uuid.UUID] = None
    project_code: str = Field(..., min_length=2, max_length=32)
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    billing_type: str = Field("FIXED_PRICE", examples=["FIXED_PRICE", "TIME_AND_MATERIALS", "RETAINER"])
    total_budget: Decimal = Decimal("0.00")
    start_date: date
    target_end_date: date
    tags: List[str] = []


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    account_id: Optional[uuid.UUID] = None
    manager_id: Optional[uuid.UUID] = None
    project_code: str
    name: str
    description: Optional[str] = None
    billing_type: str
    status: str
    health_status: str
    total_budget: Decimal
    start_date: date
    target_end_date: date
    tags: List[str]
    created_at: datetime
    account_name: Optional[str] = None
    tasks_count: int = 0
    completed_tasks_count: int = 0
