import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import (
    Base,
    GUID,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class Department(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "departments"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_department_org_code"),
        Index("ix_departments_org", "organization_id"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    teams: Mapped[List["Team"]] = relationship("Team", back_populates="department")
    employees: Mapped[List["Employee"]] = relationship("Employee", back_populates="department")


class Team(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "teams"
    __table_args__ = (
        Index("ix_teams_department", "department_id"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    department: Mapped["Department"] = relationship("Department", back_populates="teams")
    members: Mapped[List["Employee"]] = relationship("Employee", back_populates="team")


class Employee(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "employees"
    __table_args__ = (
        UniqueConstraint("organization_id", "employee_code", name="uq_employee_org_code"),
        Index("ix_employees_org_user", "organization_id", "user_id"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    team_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
    )
    manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    employee_code: Mapped[str] = mapped_column(String(32), nullable=False)
    job_title: Mapped[str] = mapped_column(String(128), nullable=False)
    employment_type: Mapped[str] = mapped_column(
        String(32), default="FULL_TIME", nullable=False
    )  # FULL_TIME, CONTRACT, INTERN, PART_TIME
    hourly_cost_rate: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00"), nullable=False
    )
    joined_date: Mapped[date] = mapped_column(
        Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False
    )

    # Relationships
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="employees")
    team: Mapped[Optional["Team"]] = relationship("Team", back_populates="members")
    intern_profile: Mapped[Optional["InternProfile"]] = relationship(
        "InternProfile", back_populates="employee", uselist=False, cascade="all, delete-orphan", foreign_keys="InternProfile.employee_id"
    )
    attendance_records: Mapped[List["AttendanceLog"]] = relationship(
        "AttendanceLog", back_populates="employee", cascade="all, delete-orphan"
    )
    leave_requests: Mapped[List["LeaveRequest"]] = relationship(
        "LeaveRequest", back_populates="employee", cascade="all, delete-orphan", foreign_keys="LeaveRequest.employee_id"
    )


class InternProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "intern_profiles"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("employees.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    mentor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    university: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    internship_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    internship_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    stipend: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    certificate_issued: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    employee: Mapped["Employee"] = relationship("Employee", back_populates="intern_profile", foreign_keys=[employee_id])
    mentor: Mapped[Optional["Employee"]] = relationship("Employee", foreign_keys=[mentor_id])


class AttendanceLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "attendance_logs"
    __table_args__ = (
        UniqueConstraint("employee_id", "work_date", name="uq_employee_work_date"),
        Index("ix_attendance_work_date", "work_date"),
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    clock_in: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    clock_out: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default="PRESENT", nullable=False
    )  # PRESENT, HALF_DAY, LATE, OVERTIME

    # Relationships
    employee: Mapped["Employee"] = relationship("Employee", back_populates="attendance_records")


class LeaveRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "leave_requests"
    __table_args__ = (
        Index("ix_leave_employee_status", "employee_id", "status"),
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )
    approver_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    leave_type: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # CASUAL, SICK, PAID, UNPAID
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_days: Mapped[int] = mapped_column(default=1, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), default="PENDING", nullable=False
    )  # PENDING, APPROVED, REJECTED
    decision_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    employee: Mapped["Employee"] = relationship("Employee", back_populates="leave_requests", foreign_keys=[employee_id])
    approver: Mapped[Optional["Employee"]] = relationship("Employee", foreign_keys=[approver_id])
