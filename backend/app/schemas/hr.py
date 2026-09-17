from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel


# --- Attendance ---

class AttendanceBase(BaseModel):
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str = "Present" # Present, Absent, Half Day, Leave, Holiday, Work From Home
    notes: Optional[str] = None


class AttendanceCreate(BaseModel):
    notes: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    id: str
    user_id: str
    total_hours: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Leave Requests ---

class LeaveRequestBase(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str


class LeaveRequestCreate(LeaveRequestBase):
    pass


class LeaveRequestResponse(LeaveRequestBase):
    id: str
    user_id: str
    status: str # REQUESTED, APPROVED, REJECTED, CANCELLED
    approved_by_user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Performance Reviews ---

class PerformanceReviewBase(BaseModel):
    review_type: str # employee_annual, intern_weekly, intern_monthly, intern_final
    review_period: str
    overall_rating: Optional[float] = None
    metrics: Dict[str, Any]


class PerformanceReviewCreate(PerformanceReviewBase):
    user_id: str


class PerformanceReviewResponse(PerformanceReviewBase):
    id: str
    user_id: str
    reviewer_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Employee Review Metrics Example ---
# {
#    "goals": "...",
#    "achievements": "...",
#    "strengths": "...",
#    "areas_for_improvement": "...",
#    "manager_comments": "..."
# }

# --- Intern Evaluation Metrics Example ---
# {
#    "technical_skills": 4.5,
#    "communication": 5.0,
#    "problem_solving": 4.0,
#    "teamwork": 5.0,
#    "task_completion": 4.5,
#    "learning_progress": 5.0,
#    "mentor_feedback": "..."
# }
