from typing import List, Optional, Any
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, Boolean, DateTime, Date, ForeignKey, Integer, Text, Numeric, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base import TimestampMixin, SoftDeleteMixin, generate_uuid


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    profiles: Mapped[List["PersonProfile"]] = relationship("PersonProfile", back_populates="department")


class PersonProfile(Base, TimestampMixin, SoftDeleteMixin):
    """
    Base profile for workforce entities (Employees, Interns, Freelancers)
    using SQLAlchemy Joined Table Inheritance.
    """
    __tablename__ = "person_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    
    # Polymorphic identity
    profile_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)

    # Common fields
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    kapate_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)
    internal_email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    
    department_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    manager_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("person_profiles.id", ondelete="SET NULL"), nullable=True)
    
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    skills: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True) # JSON array of skills
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)
    joining_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    emergency_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Inheritance mapping
    __mapper_args__ = {
        "polymorphic_on": profile_type,
        "polymorphic_identity": "person",
    }

    # Relationships
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="profiles")
    manager: Mapped[Optional["PersonProfile"]] = relationship("PersonProfile", remote_side=[id], backref="direct_reports")
    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id])


class Employee(PersonProfile):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(36), ForeignKey("person_profiles.id", ondelete="CASCADE"), primary_key=True)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    employment_type: Mapped[str] = mapped_column(String(50), nullable=False) # Full-time, Part-time, Contract
    salary: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True) # Protected
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    probation_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    __mapper_args__ = {
        "polymorphic_identity": "employee",
    }


class Intern(PersonProfile):
    __tablename__ = "interns"

    id: Mapped[str] = mapped_column(String(36), ForeignKey("person_profiles.id", ondelete="CASCADE"), primary_key=True)
    intern_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    college_institution: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    training_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # APPLIED, SELECTED, ACTIVE, COMPLETED, TERMINATED
    internship_status: Mapped[str] = mapped_column(String(50), default="APPLIED", nullable=False)
    evaluation_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    certificate_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    __mapper_args__ = {
        "polymorphic_identity": "intern",
    }


class Freelancer(PersonProfile):
    __tablename__ = "freelancers"

    id: Mapped[str] = mapped_column(String(36), ForeignKey("person_profiles.id", ondelete="CASCADE"), primary_key=True)
    contract_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    contract_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True) # Protected
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    assigned_projects_ids: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True) # JSON array of project IDs

    __mapper_args__ = {
        "polymorphic_identity": "freelancer",
    }


class Attendance(Base, TimestampMixin):
    __tablename__ = "attendance"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    check_in: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_hours: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Present", nullable=False)  # Present, Absent, Half Day, Leave, Holiday, Work From Home
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class LeaveRequest(Base, TimestampMixin):
    __tablename__ = "leave_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    leave_type: Mapped[str] = mapped_column(String(50), nullable=False)  # casual, sick, earned, unpaid
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="REQUESTED", nullable=False)  # REQUESTED, APPROVED, REJECTED, CANCELLED
    approved_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class Timesheet(Base, TimestampMixin):
    __tablename__ = "timesheets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    task_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    hours_spent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    is_billable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    billable_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True) # Cached calculation
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="DRAFT", nullable=False)  # DRAFT, SUBMITTED, APPROVED, REJECTED
    approved_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="timesheets")
    task: Mapped[Optional["Task"]] = relationship("Task")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    approved_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by_user_id])


class PerformanceReview(Base, TimestampMixin):
    __tablename__ = "performance_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    review_type: Mapped[str] = mapped_column(String(50), nullable=False) # employee_annual, intern_weekly, intern_monthly, intern_final
    review_period: Mapped[str] = mapped_column(String(100), nullable=False)
    overall_rating: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 1), nullable=True)
    
    metrics: Mapped[Any] = mapped_column(JSON, nullable=False) # JSON storing dynamic fields
    
    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewer_id])
