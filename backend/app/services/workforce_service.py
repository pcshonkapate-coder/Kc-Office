from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.workforce import Department, PersonProfile, Employee, Intern, Freelancer
from app.schemas.workforce import (
    EmployeeCreate, InternCreate, FreelancerCreate,
    PersonProfileDirectoryResponse, EmployeeResponse, InternResponse, FreelancerResponse,
    WorkforceDashboardMetrics
)
from app.core.exceptions import KapateAppException
from app.core.logging import logger


class WorkforceService:
    def __init__(self, db: Session):
        self.db = db

    def get_directory(self, department_id: Optional[str] = None, role: Optional[str] = None, type_filter: Optional[str] = None) -> List[PersonProfileDirectoryResponse]:
        query = self.db.query(PersonProfile)
        
        if department_id:
            query = query.filter(PersonProfile.department_id == department_id)
        if type_filter:
            query = query.filter(PersonProfile.profile_type == type_filter)
        
        # Omitting complex 'role' filtering for brevity, but can easily be added.
        profiles = query.all()
        return [PersonProfileDirectoryResponse.model_validate(p) for p in profiles]

    def get_profile(self, profile_id: str, requesting_user_id: str, is_hr_admin: bool) -> Any:
        profile = self.db.query(PersonProfile).filter(PersonProfile.id == profile_id).first()
        if not profile:
            raise KapateAppException(status_code=404, detail="Profile not found")

        # Determine if the user is authorized to see sensitive data
        is_self = profile.user_id == requesting_user_id
        is_manager = profile.manager_id and (
            self.db.query(PersonProfile).filter(PersonProfile.id == profile.manager_id, PersonProfile.user_id == requesting_user_id).first() is not None
        )
        
        can_view_sensitive = is_self or is_manager or is_hr_admin

        if profile.profile_type == "employee":
            return EmployeeResponse.model_validate(profile) if can_view_sensitive else PersonProfileDirectoryResponse.model_validate(profile)
        elif profile.profile_type == "intern":
            return InternResponse.model_validate(profile) if can_view_sensitive else PersonProfileDirectoryResponse.model_validate(profile)
        elif profile.profile_type == "freelancer":
            return FreelancerResponse.model_validate(profile) if can_view_sensitive else PersonProfileDirectoryResponse.model_validate(profile)

        return PersonProfileDirectoryResponse.model_validate(profile)

    def create_employee(self, data: EmployeeCreate) -> EmployeeResponse:
        dump = data.model_dump()
        if not dump.get("employee_id"):
            count = self.db.query(func.count(Employee.id)).scalar() or 0
            dump["employee_id"] = f"EMP-{count + 1:03d}"
        emp = Employee(**dump)
        self.db.add(emp)
        self.db.commit()
        self.db.refresh(emp)
        return EmployeeResponse.model_validate(emp)

    def create_intern(self, data: InternCreate) -> InternResponse:
        intern = Intern(**data.model_dump())
        self.db.add(intern)
        self.db.commit()
        self.db.refresh(intern)
        return InternResponse.model_validate(intern)

    def create_freelancer(self, data: FreelancerCreate) -> FreelancerResponse:
        freelancer = Freelancer(**data.model_dump())
        self.db.add(freelancer)
        self.db.commit()
        self.db.refresh(freelancer)
        return FreelancerResponse.model_validate(freelancer)

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        total_headcount = self.db.query(PersonProfile).count()
        emp_count = self.db.query(func.count(Employee.id)).filter(Employee.status == "ACTIVE").scalar() or 0
        full_time_count = self.db.query(Employee).filter(Employee.employment_type == "full_time").count()
        intern_count = self.db.query(func.count(Intern.id)).filter(Intern.status == "ACTIVE").scalar() or 0
        freelancer_count = self.db.query(func.count(Freelancer.id)).filter(Freelancer.status == "ACTIVE").scalar() or 0
        departments_count = self.db.query(Department).count()
        
        return {
            "total_headcount": total_headcount,
            "full_time_count": full_time_count,
            "departments_count": departments_count,
            "total_employees": emp_count,
            "active_interns": intern_count,
            "active_freelancers": freelancer_count,
            "open_positions": 0
        }
