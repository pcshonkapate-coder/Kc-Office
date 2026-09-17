from typing import List, Optional, Dict, Any
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.workforce import Timesheet, PersonProfile, Employee, Intern, Freelancer
from app.models.delivery import ResourceAllocation, Project, Task
from app.models.auth import User
from app.schemas.timesheet import (
    ResourceAllocationCreate, ResourceAllocationResponse, ResourceAllocationAdminResponse,
    TimesheetCreate, TimesheetResponse,
    WorkloadReport, ProjectHoursReport
)
from app.core.exceptions import KapateAppException
from app.core.logging import logger


class TimesheetService:
    def __init__(self, db: Session):
        self.db = db

    # --- Resource Allocation ---
    def allocate_resource(self, data: ResourceAllocationCreate) -> ResourceAllocationAdminResponse:
        alloc = ResourceAllocation(**data.model_dump())
        self.db.add(alloc)
        self.db.commit()
        self.db.refresh(alloc)
        return ResourceAllocationAdminResponse.model_validate(alloc)

    def get_project_allocations(self, project_id: str, is_authorized: bool) -> List[Any]:
        allocs = self.db.query(ResourceAllocation).filter(ResourceAllocation.project_id == project_id).all()
        if is_authorized:
            return [ResourceAllocationAdminResponse.model_validate(a) for a in allocs]
        return [ResourceAllocationResponse.model_validate(a) for a in allocs]

    # --- Timesheets ---
    def create_timesheet(self, data: TimesheetCreate, current_user_id: str) -> TimesheetResponse:
        ts = Timesheet(
            **data.model_dump(),
            user_id=current_user_id,
            status="DRAFT"
        )
        self.db.add(ts)
        self.db.commit()
        self.db.refresh(ts)
        return TimesheetResponse.model_validate(ts)

    def submit_timesheet(self, timesheet_id: str, current_user_id: str) -> TimesheetResponse:
        ts = self.db.query(Timesheet).filter(Timesheet.id == timesheet_id, Timesheet.user_id == current_user_id).first()
        if not ts:
            raise KapateAppException(status_code=404, detail="Timesheet not found")
        if ts.status != "DRAFT":
            raise KapateAppException(status_code=400, detail="Only DRAFT timesheets can be submitted")

        # Calculate billable_value
        if ts.is_billable:
            # Find allocation for this user on this project
            alloc = self.db.query(ResourceAllocation).filter(
                ResourceAllocation.project_id == ts.project_id,
                ResourceAllocation.user_id == ts.user_id
            ).order_by(ResourceAllocation.created_at.desc()).first()

            if alloc:
                ts.billable_value = ts.hours_spent * alloc.billing_rate
            else:
                ts.billable_value = 0.0
        else:
            ts.billable_value = 0.0

        ts.status = "SUBMITTED"
        self.db.commit()
        self.db.refresh(ts)
        
        # Intern workflow: If intern, it needs mentor approval (handled externally or by notifications)
        # Assuming typical notification triggers here...
        
        return TimesheetResponse.model_validate(ts)

    def review_timesheet(self, timesheet_id: str, reviewer_id: str, action: str) -> TimesheetResponse:
        ts = self.db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
        if not ts:
            raise KapateAppException(status_code=404, detail="Timesheet not found")
        if ts.status != "SUBMITTED":
            raise KapateAppException(status_code=400, detail="Only SUBMITTED timesheets can be reviewed")

        if action == "approve":
            ts.status = "APPROVED"
        elif action == "reject":
            ts.status = "REJECTED"
            # Reset billable value since it's rejected
            ts.billable_value = None
        else:
            raise KapateAppException(status_code=400, detail="Invalid action")

        ts.approved_by_user_id = reviewer_id
        
        # If approved, roll up actual_hours onto the task if a task exists
        if ts.status == "APPROVED" and ts.task_id:
            task = self.db.query(Task).filter(Task.id == ts.task_id).first()
            if task:
                task.actual_hours = float(task.actual_hours or 0.0) + ts.hours_spent

        self.db.commit()
        self.db.refresh(ts)
        return TimesheetResponse.model_validate(ts)

    # --- Reports ---
    def get_workload_report(self, user_id: str) -> WorkloadReport:
        # Standard work week is 40h
        allocs = self.db.query(func.sum(ResourceAllocation.allocation_percentage)).filter(
            ResourceAllocation.user_id == user_id,
            ResourceAllocation.end_date == None  # currently active
        ).scalar() or 0
        
        allocated_pct = allocs
        allocated_h = (allocated_pct / 100.0) * 40.0
        
        return WorkloadReport(
            available_hours=max(40.0 - allocated_h, 0.0),
            allocated_hours=allocated_h,
            overallocated=allocated_pct > 100,
            underutilized=allocated_pct < 50
        )

    def get_project_hours_report(self, project_id: str) -> ProjectHoursReport:
        # Estimate
        est_h = self.db.query(func.sum(Task.estimated_hours)).filter(Task.project_id == project_id).scalar() or 0.0
        
        # Logged (Approved)
        approved_ts = self.db.query(Timesheet).filter(Timesheet.project_id == project_id, Timesheet.status == "APPROVED").all()
        logged_h = sum(ts.hours_spent for ts in approved_ts)
        billable_h = sum(ts.hours_spent for ts in approved_ts if ts.is_billable)
        non_billable_h = sum(ts.hours_spent for ts in approved_ts if not ts.is_billable)
        billable_val = sum(ts.billable_value or 0.0 for ts in approved_ts)
        
        return ProjectHoursReport(
            estimated_hours=est_h,
            logged_hours=logged_h,
            remaining_hours=max(est_h - logged_h, 0.0),
            billable_hours=billable_h,
            non_billable_hours=non_billable_h,
            total_billable_value=billable_val
        )
