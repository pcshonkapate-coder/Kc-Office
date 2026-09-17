from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from app.models.workforce import Department, Employee, Intern, Freelancer, Attendance, LeaveRequest, Timesheet
from app.models.auth import User
from app.models.delivery import Project, Task


class WorkforceRepository:
    def __init__(self, db: Session):
        self.db = db

    # ==================== DEPARTMENTS ====================
    def get_departments(self) -> List[Department]:
        return self.db.query(Department).order_by(Department.name).all()

    def get_department_by_id(self, dept_id: str) -> Optional[Department]:
        return self.db.query(Department).filter(Department.id == dept_id).first()

    def get_department_by_code(self, code: str) -> Optional[Department]:
        return self.db.query(Department).filter(Department.code == code).first()

    def create_department(self, dept: Department) -> Department:
        self.db.add(dept)
        self.db.commit()
        self.db.refresh(dept)
        return dept

    def update_department(self, dept: Department, data: dict) -> Department:
        for k, v in data.items():
            if v is not None:
                setattr(dept, k, v)
        self.db.commit()
        self.db.refresh(dept)
        return dept

    # ==================== EMPLOYEES ====================
    def get_employees(self, search: Optional[str] = None, dept_id: Optional[str] = None) -> List[Employee]:
        query = self.db.query(Employee).options(joinedload(Employee.user), joinedload(Employee.department)).filter(Employee.is_deleted.is_(False))
        if dept_id:
            query = query.filter(Employee.department_id == dept_id)
        if search:
            s = f"%{search.lower()}%"
            query = query.join(Employee.user).filter(
                or_(
                    func.lower(User.first_name).like(s),
                    func.lower(User.last_name).like(s),
                    func.lower(Employee.designation).like(s),
                    func.lower(Employee.employee_code).like(s),
                )
            )
        return query.order_by(Employee.employee_code).all()

    def get_employee_by_id(self, emp_id: str) -> Optional[Employee]:
        return self.db.query(Employee).options(joinedload(Employee.user), joinedload(Employee.department)).filter(Employee.id == emp_id, Employee.is_deleted.is_(False)).first()

    def get_employee_by_user_id(self, user_id: str) -> Optional[Employee]:
        return self.db.query(Employee).options(joinedload(Employee.user), joinedload(Employee.department)).filter(Employee.user_id == user_id, Employee.is_deleted.is_(False)).first()

    def create_employee(self, employee: Employee) -> Employee:
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return employee

    # ==================== INTERNS ====================
    def get_interns(self, dept_id: Optional[str] = None) -> List[Intern]:
        query = self.db.query(Intern).options(joinedload(Intern.user), joinedload(Intern.department), joinedload(Intern.mentor).joinedload(Employee.user))
        if dept_id:
            query = query.filter(Intern.department_id == dept_id)
        return query.order_by(Intern.start_date.desc()).all()

    def get_intern_by_id(self, intern_id: str) -> Optional[Intern]:
        return self.db.query(Intern).options(joinedload(Intern.user), joinedload(Intern.department), joinedload(Intern.mentor)).filter(Intern.id == intern_id).first()

    def create_intern(self, intern: Intern) -> Intern:
        self.db.add(intern)
        self.db.commit()
        self.db.refresh(intern)
        return intern

    # ==================== FREELANCERS ====================
    def get_freelancers(self) -> List[Freelancer]:
        return self.db.query(Freelancer).options(joinedload(Freelancer.user)).all()

    def get_freelancer_by_id(self, freelancer_id: str) -> Optional[Freelancer]:
        return self.db.query(Freelancer).options(joinedload(Freelancer.user)).filter(Freelancer.id == freelancer_id).first()

    def create_freelancer(self, freelancer: Freelancer) -> Freelancer:
        self.db.add(freelancer)
        self.db.commit()
        self.db.refresh(freelancer)
        return freelancer

    # ==================== ATTENDANCE ====================
    def get_attendance(self, target_date: Optional[date] = None, user_id: Optional[str] = None) -> List[Attendance]:
        query = self.db.query(Attendance)
        if target_date:
            query = query.filter(Attendance.date == target_date)
        if user_id:
            query = query.filter(Attendance.user_id == user_id)
        return query.order_by(Attendance.date.desc()).all()

    def get_user_attendance_for_date(self, user_id: str, for_date: date) -> Optional[Attendance]:
        return self.db.query(Attendance).filter(Attendance.user_id == user_id, Attendance.date == for_date).first()

    def create_or_update_attendance(self, att: Attendance) -> Attendance:
        self.db.add(att)
        self.db.commit()
        self.db.refresh(att)
        return att

    # ==================== LEAVES ====================
    def get_leave_requests(self, status: Optional[str] = None, user_id: Optional[str] = None) -> List[LeaveRequest]:
        query = self.db.query(LeaveRequest)
        if status:
            query = query.filter(LeaveRequest.status == status)
        if user_id:
            query = query.filter(LeaveRequest.user_id == user_id)
        return query.order_by(LeaveRequest.start_date.desc()).all()

    def get_leave_request_by_id(self, leave_id: str) -> Optional[LeaveRequest]:
        return self.db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()

    def create_leave_request(self, leave: LeaveRequest) -> LeaveRequest:
        self.db.add(leave)
        self.db.commit()
        self.db.refresh(leave)
        return leave

    def update_leave_status(self, leave: LeaveRequest, new_status: str, approver_id: str) -> LeaveRequest:
        leave.status = new_status
        leave.approved_by_user_id = approver_id
        self.db.commit()
        self.db.refresh(leave)
        return leave

    # ==================== TIMESHEETS ====================
    def get_timesheets(
        self,
        project_id: Optional[str] = None,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Timesheet]:
        query = self.db.query(Timesheet).options(
            joinedload(Timesheet.project),
            joinedload(Timesheet.task),
            joinedload(Timesheet.user),
        )
        if project_id:
            query = query.filter(Timesheet.project_id == project_id)
        if user_id:
            query = query.filter(Timesheet.user_id == user_id)
        if status:
            query = query.filter(Timesheet.status == status)
        if start_date:
            query = query.filter(Timesheet.date >= start_date)
        if end_date:
            query = query.filter(Timesheet.date <= end_date)
        return query.order_by(Timesheet.date.desc()).all()

    def get_timesheet_by_id(self, ts_id: str) -> Optional[Timesheet]:
        return self.db.query(Timesheet).options(
            joinedload(Timesheet.project),
            joinedload(Timesheet.task),
            joinedload(Timesheet.user),
        ).filter(Timesheet.id == ts_id).first()

    def create_timesheet(self, ts: Timesheet) -> Timesheet:
        self.db.add(ts)
        self.db.commit()
        self.db.refresh(ts)
        return ts

    def update_timesheet_status(self, ts: Timesheet, new_status: str, approver_id: str) -> Timesheet:
        ts.status = new_status
        ts.approved_by_user_id = approver_id
        self.db.commit()
        self.db.refresh(ts)
        return ts

    # ==================== METRICS ====================
    def get_metrics(self) -> Dict[str, Any]:
        total_employees = self.db.query(func.count(Employee.id)).filter(Employee.is_deleted.is_(False)).scalar() or 0
        total_interns = self.db.query(func.count(Intern.id)).scalar() or 0
        total_freelancers = self.db.query(func.count(Freelancer.id)).scalar() or 0
        total_depts = self.db.query(func.count(Department.id)).scalar() or 0

        today = date.today()
        present_today = self.db.query(func.count(Attendance.id)).filter(
            Attendance.date == today,
            Attendance.status.in_(["present", "half_day"])
        ).scalar() or 0

        on_leave_today = self.db.query(func.count(LeaveRequest.id)).filter(
            LeaveRequest.status == "approved",
            LeaveRequest.start_date <= today,
            LeaveRequest.end_date >= today
        ).scalar() or 0

        pending_timesheets = self.db.query(func.count(Timesheet.id)).filter(Timesheet.status == "submitted").scalar() or 0

        return {
            "total_headcount": total_employees + total_interns + total_freelancers,
            "full_time_count": total_employees,
            "interns_count": total_interns,
            "freelancers_count": total_freelancers,
            "departments_count": total_depts,
            "present_today": present_today,
            "on_leave_today": on_leave_today,
            "timesheets_pending_approval": pending_timesheets,
        }
