from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


# Department Schemas
class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    code: str = Field(..., min_length=2, max_length=32)
    description: Optional[str] = None


class DepartmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    code: str
    description: Optional[str] = None
    created_at: datetime


# Employee Schemas
class EmployeeCreate(BaseModel):
    user_id: uuid.UUID
    department_id: Optional[uuid.UUID] = None
    team_id: Optional[uuid.UUID] = None
    manager_id: Optional[uuid.UUID] = None
    employee_code: str = Field(..., min_length=2, max_length=32)
    job_title: str = Field(..., min_length=2, max_length=128)
    employment_type: str = Field("FULL_TIME", examples=["FULL_TIME", "INTERN", "CONTRACT"])
    hourly_cost_rate: Decimal = Decimal("0.00")
    joined_date: date = Field(default_factory=date.today)


class EmployeeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    department_id: Optional[uuid.UUID] = None
    team_id: Optional[uuid.UUID] = None
    employee_code: str
    job_title: str
    employment_type: str
    hourly_cost_rate: Decimal
    joined_date: date
    full_name: Optional[str] = None
    email: Optional[str] = None
    department_name: Optional[str] = None


# Intern Profile Schemas
class InternProfileCreate(BaseModel):
    employee_id: uuid.UUID
    mentor_id: Optional[uuid.UUID] = None
    university: Optional[str] = None
    internship_start_date: date
    internship_end_date: date
    stipend: Decimal = Decimal("0.00")


class InternProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    mentor_id: Optional[uuid.UUID] = None
    university: Optional[str] = None
    internship_start_date: date
    internship_end_date: date
    stipend: Decimal
    certificate_issued: bool
    intern_name: Optional[str] = None
    mentor_name: Optional[str] = None


# Attendance Schemas
class ClockInOutResponse(BaseModel):
    message: str
    log_id: uuid.UUID
    work_date: date
    clock_in: datetime
    clock_out: Optional[datetime] = None
    status: str


class AttendanceLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    work_date: date
    clock_in: datetime
    clock_out: Optional[datetime] = None
    status: str
    employee_name: Optional[str] = None


# Leave Schemas
class LeaveRequestCreate(BaseModel):
    leave_type: str = Field(..., examples=["CASUAL", "SICK", "PAID", "UNPAID"])
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=5)


class LeaveRequestStatusUpdate(BaseModel):
    status: str = Field(..., examples=["APPROVED", "REJECTED"])
    decision_notes: Optional[str] = None


class LeaveRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    approver_id: Optional[uuid.UUID] = None
    leave_type: str
    start_date: date
    end_date: date
    total_days: int
    reason: str
    status: str
    decision_notes: Optional[str] = None
    created_at: datetime
    employee_name: Optional[str] = None
