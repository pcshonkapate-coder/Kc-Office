from typing import List, Optional, Any
from datetime import date, datetime
from pydantic import BaseModel, Field


# --- Resource Allocation ---

class ResourceAllocationBase(BaseModel):
    project_id: str
    user_id: str
    role_in_project: str
    allocation_percentage: int = 100
    start_date: date
    end_date: Optional[date] = None
    currency: str = "USD"


class ResourceAllocationCreate(ResourceAllocationBase):
    billing_rate: float = 0.0
    internal_cost_rate: float = 0.0


class ResourceAllocationResponse(ResourceAllocationBase):
    """
    Public response. Explicitly hides billing and cost rates from unauthorized users.
    """
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResourceAllocationAdminResponse(ResourceAllocationResponse):
    """
    Admin/Manager response. Exposes sensitive rates.
    """
    billing_rate: float
    internal_cost_rate: float


# --- Timesheets ---

class TimesheetBase(BaseModel):
    project_id: str
    task_id: Optional[str] = None
    date: date
    hours_spent: float
    is_billable: bool = True
    description: str


class TimesheetCreate(TimesheetBase):
    pass


class TimesheetResponse(TimesheetBase):
    id: str
    user_id: str
    status: str
    billable_value: Optional[float] = None
    approved_by_user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Reporting & Workload ---

class WorkloadReport(BaseModel):
    available_hours: float
    allocated_hours: float
    overallocated: bool
    underutilized: bool


class ProjectHoursReport(BaseModel):
    estimated_hours: float
    logged_hours: float
    remaining_hours: float
    billable_hours: float
    non_billable_hours: float
    total_billable_value: float
