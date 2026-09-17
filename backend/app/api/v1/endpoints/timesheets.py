from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.schemas.timesheet import (
    ResourceAllocationCreate, ResourceAllocationAdminResponse,
    TimesheetCreate, TimesheetResponse,
    WorkloadReport, ProjectHoursReport
)
from app.services.timesheet_service import TimesheetService

router = APIRouter()

def get_timesheet_service(db: Session = Depends(get_db)):
    return TimesheetService(db)

def is_hr_or_manager(user: User) -> bool:
    # A simplified RBAC check. In a real app, this checks specific role codes.
    for role in user.roles:
        if role.name in ["HR_ADMIN", "PROJECT_MANAGER", "FINANCE"]:
            return True
    return False

# --- Allocations ---

@router.post("/allocations", response_model=ResourceAllocationAdminResponse, status_code=status.HTTP_201_CREATED)
def create_allocation(
    data: ResourceAllocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """
    Allocate a user to a project with billing rates. 
    Strict RBAC: Only HR or PMs can allocate with rates.
    """
    if not is_hr_or_manager(current_user):
        raise HTTPException(status_code=403, detail="Unauthorized to allocate resources")
    return service.allocate_resource(data)

@router.get("/allocations/project/{project_id}")
def get_project_allocations(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """
    Returns allocations. Strips billing/cost rates if requester is not authorized.
    """
    authorized = is_hr_or_manager(current_user)
    return service.get_project_allocations(project_id, authorized)

# --- Timesheets ---

@router.post("/", response_model=TimesheetResponse, status_code=status.HTTP_201_CREATED)
def create_timesheet(
    data: TimesheetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """Creates a timesheet entry in DRAFT mode."""
    return service.create_timesheet(data, current_user.id)

@router.patch("/{timesheet_id}/submit", response_model=TimesheetResponse)
def submit_timesheet(
    timesheet_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """Submits a DRAFT timesheet, instantly freezing its calculated billable_value."""
    return service.submit_timesheet(timesheet_id, current_user.id)

@router.patch("/{timesheet_id}/review", response_model=TimesheetResponse)
def review_timesheet(
    timesheet_id: str,
    action: str = Query(..., description="approve or reject"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """Approves or rejects a SUBMITTED timesheet. Rolling up hours if approved."""
    if not is_hr_or_manager(current_user):
        raise HTTPException(status_code=403, detail="Unauthorized to review timesheets")
    return service.review_timesheet(timesheet_id, current_user.id, action)

# --- Reports ---

@router.get("/reports/workload/{user_id}", response_model=WorkloadReport)
def get_workload_report(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """Returns workload utilization metrics."""
    return service.get_workload_report(user_id)

@router.get("/reports/project/{project_id}", response_model=ProjectHoursReport)
def get_project_hours_report(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """Returns estimated vs logged vs billable hours for a project."""
    if not is_hr_or_manager(current_user):
        raise HTTPException(status_code=403, detail="Unauthorized to view project financials")
    return service.get_project_hours_report(project_id)
