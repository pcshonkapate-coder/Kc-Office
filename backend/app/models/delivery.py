from typing import List, Optional, Any
from datetime import date
from decimal import Decimal
from sqlalchemy import String, Boolean, Date, ForeignKey, Integer, Text, Numeric, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base import TimestampMixin, SoftDeleteMixin, generate_uuid


class Project(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    contract_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True)
    deal_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)
    
    project_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    project_type: Mapped[str] = mapped_column(String(50), default="fixed_bid", nullable=False)
    
    # PLANNING, DISCOVERY, ARCHITECTURE, DESIGN, DEVELOPMENT, AI/ML, QA, DEPLOYMENT, MAINTENANCE, COMPLETED, ON HOLD, CANCELLED
    status: Mapped[str] = mapped_column(String(50), default="PLANNING", index=True, nullable=False)  
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False) # low, medium, high, critical
    
    budget: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    project_manager_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="projects")
    contract: Mapped[Optional["Contract"]] = relationship("Contract", back_populates="projects")
    deal: Mapped[Optional["Deal"]] = relationship("Deal")
    project_manager: Mapped[Optional["User"]] = relationship("User")
    milestones: Mapped[List["Milestone"]] = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    allocations: Mapped[List["ResourceAllocation"]] = relationship("ResourceAllocation", back_populates="project", cascade="all, delete-orphan")
    timesheets: Mapped[List["Timesheet"]] = relationship("Timesheet", back_populates="project")
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="project")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="project")


class Milestone(Base, TimestampMixin):
    __tablename__ = "milestones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    deliverable_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, in_progress, client_review, approved, invoiced
    
    completion_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    client_visible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="milestones")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="milestone")


class Task(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    milestone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("milestones.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)  # low, medium, high, urgent
    
    # TODO, IN PROGRESS, IN REVIEW, CHANGES REQUESTED, BLOCKED, COMPLETED
    status: Mapped[str] = mapped_column(String(50), default="TODO", index=True, nullable=False)
    board_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False) # Kanban position
    client_visible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    estimated_hours: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    actual_hours: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=Decimal("0.00"), nullable=False)
    
    assigned_to_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    tags: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True) # JSON array of tag strings

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="tasks")
    milestone: Mapped[Optional["Milestone"]] = relationship("Milestone", back_populates="tasks")
    assignee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_to_user_id])
    reviewer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reviewer_id])
    subtasks: Mapped[List["Subtask"]] = relationship("Subtask", back_populates="parent_task", cascade="all, delete-orphan")


class Subtask(Base, TimestampMixin):
    __tablename__ = "subtasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    parent_task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    assigned_to_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    parent_task: Mapped["Task"] = relationship("Task", back_populates="subtasks")


class DeliveryComment(Base, TimestampMixin):
    """
    Polymorphic comments replacing TaskComment. Can attach to project, milestone, or task.
    """
    __tablename__ = "delivery_comments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    entity_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False) # project, milestone, task
    entity_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    comment_text: Mapped[str] = mapped_column(Text, nullable=False)
    client_visible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    author: Mapped["User"] = relationship("User")


class ResourceAllocation(Base, TimestampMixin):
    __tablename__ = "resource_allocations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_in_project: Mapped[str] = mapped_column(String(100), nullable=False)
    allocation_percentage: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    billing_rate: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    internal_cost_rate: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="allocations")
    user: Mapped["User"] = relationship("User")
