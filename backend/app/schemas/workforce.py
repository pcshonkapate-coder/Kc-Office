from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, EmailStr


# --- Base Profile Schemas ---

class PersonProfileBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    location: Optional[str] = None
    department_id: Optional[str] = None
    manager_id: Optional[str] = None
    designation: Optional[str] = None
    skills: Optional[List[str]] = None
    joining_date: Optional[date] = None
    emergency_contact: Optional[str] = None
    notes: Optional[str] = None


class PersonProfileDirectoryResponse(BaseModel):
    """
    Public directory response for any person.
    Strictly omits salary, rate, and sensitive HR data.
    """
    id: str
    profile_type: str
    name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[str] = None
    skills: Optional[List[str]] = None
    status: str
    
    class Config:
        from_attributes = True


# --- Employee Schemas ---

class EmployeeCreate(PersonProfileBase):
    employee_id: Optional[str] = None
    employment_type: str
    salary: Optional[float] = None
    currency: str = "INR"
    probation_status: Optional[str] = None


class EmployeeResponse(PersonProfileDirectoryResponse):
    """Admin/Self response for Employee"""
    employee_id: str
    employment_type: str
    salary: Optional[float] = None
    currency: str
    probation_status: Optional[str] = None
    role: Optional[str] = None

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        res = super().model_validate(obj, *args, **kwargs)
        if not res.role and res.designation:
            res.role = res.designation
        return res


# --- Intern Schemas ---

class InternCreate(PersonProfileBase):
    intern_id: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    college_institution: Optional[str] = None
    training_plan: Optional[str] = None
    internship_status: str = "APPLIED"


class InternResponse(PersonProfileDirectoryResponse):
    intern_id: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    college_institution: Optional[str] = None
    training_plan: Optional[str] = None
    internship_status: str
    evaluation_status: Optional[str] = None
    certificate_status: Optional[str] = None


# --- Freelancer Schemas ---

class FreelancerCreate(PersonProfileBase):
    contract_start: Optional[date] = None
    contract_end: Optional[date] = None
    rate: Optional[float] = None
    currency: str = "USD"
    assigned_projects_ids: Optional[List[str]] = None


class FreelancerResponse(PersonProfileDirectoryResponse):
    contract_start: Optional[date] = None
    contract_end: Optional[date] = None
    rate: Optional[float] = None
    currency: str
    assigned_projects_ids: Optional[List[str]] = None


# --- Dashboard Dashboard Metrics ---

class WorkforceDashboardMetrics(BaseModel):
    total_employees: int
    active_interns: int
    active_freelancers: int
    open_positions: int
