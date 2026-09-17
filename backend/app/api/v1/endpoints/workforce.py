from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user, get_current_user
from app.models.auth import User
from app.schemas.workforce import (
    PersonProfileDirectoryResponse, EmployeeCreate, EmployeeResponse,
    InternCreate, InternResponse, FreelancerCreate, FreelancerResponse,
    WorkforceDashboardMetrics
)
from app.services.workforce_service import WorkforceService

router = APIRouter()

def get_workforce_service(db: Session = Depends(get_db)):
    return WorkforceService(db)

def has_hr_admin_role(user: User) -> bool:
    for role in user.roles:
        if role.name in ["HR_ADMIN", "superadmin", "partner"]:
            return True
    return False

@router.get("/directory", response_model=List[PersonProfileDirectoryResponse])
def get_directory(
    department_id: Optional[str] = None,
    type_filter: Optional[str] = Query(None, description="employee, intern, freelancer"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: WorkforceService = Depends(get_workforce_service)
):
    """
    Returns the team directory. Strips all sensitive HR data (salaries, rates) globally.
    """
    return service.get_directory(department_id=department_id, type_filter=type_filter)

@router.get("/metrics")
@router.get("/dashboard-metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: WorkforceService = Depends(get_workforce_service)
):
    """
    Returns aggregate counts for the workforce dashboard.
    """
    return service.get_dashboard_metrics()

@router.get("/{profile_id}")
def get_profile(
    profile_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: WorkforceService = Depends(get_workforce_service)
):
    """
    Returns a specific profile. Exposes salary/rate only if user is self, manager, or HR_ADMIN.
    """
    is_hr = has_hr_admin_role(current_user)
    return service.get_profile(profile_id, current_user.id, is_hr)

@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
@router.post("/employee", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: WorkforceService = Depends(get_workforce_service)
):
    if not has_hr_admin_role(current_user):
        raise HTTPException(status_code=403, detail="Only HR_ADMIN can create employees")
    return service.create_employee(data)

@router.post("/intern", response_model=InternResponse, status_code=status.HTTP_201_CREATED)
def create_intern(
    data: InternCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: WorkforceService = Depends(get_workforce_service)
):
    if not has_hr_admin_role(current_user):
        raise HTTPException(status_code=403, detail="Only HR_ADMIN can create interns")
    return service.create_intern(data)

@router.post("/freelancer", response_model=FreelancerResponse, status_code=status.HTTP_201_CREATED)
def create_freelancer(
    data: FreelancerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: WorkforceService = Depends(get_workforce_service)
):
    if not has_hr_admin_role(current_user):
        raise HTTPException(status_code=403, detail="Only HR_ADMIN can create freelancers")
    return service.create_freelancer(data)

# --- Attendance & Leaves Integration ---
from app.services.hr_service import HRService
from app.schemas.hr import AttendanceCreate, LeaveRequestCreate

@router.post("/attendance/check-in")
def workforce_check_in(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    hr_serv = HRService(db)
    return hr_serv.check_in(current_user.id, data.notes)

@router.post("/attendance/check-out")
@router.patch("/attendance/check-out")
def workforce_check_out(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    hr_serv = HRService(db)
    return hr_serv.check_out(current_user.id, data.notes)

@router.post("/leaves", status_code=status.HTTP_201_CREATED)
def workforce_create_leave(
    data: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    hr_serv = HRService(db)
    return hr_serv.request_leave(data, current_user.id)

@router.patch("/leaves/{leave_id}/status")
def workforce_update_leave_status(
    leave_id: str,
    payload: dict = {},
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    hr_serv = HRService(db)
    act = payload.get("status") or action or "APPROVED"
    return hr_serv.process_leave(leave_id, act.upper(), current_user.id)
