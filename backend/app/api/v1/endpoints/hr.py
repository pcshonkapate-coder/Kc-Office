from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.schemas.hr import (
    AttendanceCreate, AttendanceResponse, 
    LeaveRequestCreate, LeaveRequestResponse,
    PerformanceReviewCreate, PerformanceReviewResponse
)
from app.services.hr_service import HRService

router = APIRouter()

def get_hr_service(db: Session = Depends(get_db)):
    return HRService(db)

def is_hr_admin(user: User) -> bool:
    for role in user.roles:
        if role.name == "HR_ADMIN":
            return True
    return False

# --- Attendance ---

@router.post("/attendance/check-in", response_model=AttendanceResponse)
def check_in(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: HRService = Depends(get_hr_service)
):
    """Record daily check-in."""
    return service.check_in(current_user.id, data.notes)

@router.patch("/attendance/check-out", response_model=AttendanceResponse)
def check_out(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: HRService = Depends(get_hr_service)
):
    """Record daily check-out and compute total hours."""
    return service.check_out(current_user.id, data.notes)

# --- Leaves ---

@router.post("/leaves", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def request_leave(
    data: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: HRService = Depends(get_hr_service)
):
    """Submit a new leave request."""
    return service.request_leave(data, current_user.id)

@router.patch("/leaves/{leave_id}/status", response_model=LeaveRequestResponse)
def process_leave(
    leave_id: str,
    action: str = Query(..., description="APPROVED, REJECTED, CANCELLED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: HRService = Depends(get_hr_service)
):
    """Process a leave request."""
    # Simplified auth for demo, normally check if user is manager or HR
    return service.process_leave(leave_id, action, current_user.id)

# --- Performance Reviews ---

@router.post("/reviews", response_model=PerformanceReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    data: PerformanceReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: HRService = Depends(get_hr_service)
):
    """Submit an employee or intern performance review."""
    return service.submit_review(data, current_user.id)

# --- Certificates ---

@router.post("/interns/{intern_id}/certificate")
def issue_certificate(
    intern_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: HRService = Depends(get_hr_service)
):
    """Generate and store an internship completion certificate PDF."""
    if not is_hr_admin(current_user):
        raise HTTPException(status_code=403, detail="Only HR_ADMIN can issue certificates")
        
    return service.generate_intern_certificate(intern_id, current_user.id)
