from typing import Optional, List, Any
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class PublicRegistrationRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    application_id: Optional[str] = Field(None, max_length=100)
    requested_type: str = Field("EMPLOYEE", description="EMPLOYEE, INTERN, FREELANCER")
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    notes: Optional[str] = None


class RegistrationRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    application_id: Optional[str] = None
    requested_type: str
    status: str
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    reviewed_by_user_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class RegistrationApprovalRequest(BaseModel):
    role: str = Field(..., description="EMPLOYEE, INTERN, PROJECT_MANAGER, HR_ADMIN, FINANCE_ADMIN, ADMIN")
    department_id: Optional[str] = None
    manager_id: Optional[str] = None
    designation: str = Field(..., min_length=2, max_length=100)
    employment_type: str = Field("EMPLOYEE", description="EMPLOYEE, INTERN, FREELANCER")


class RegistrationRejectRequest(BaseModel):
    reason: Optional[str] = Field("Does not meet current onboarding requirements", max_length=500)


class AdminOnboardRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    designation: str = Field(..., min_length=2, max_length=100)
    department_id: Optional[str] = None
    employment_type: str = Field("EMPLOYEE", description="EMPLOYEE, INTERN, FREELANCER")
    role: str = Field("EMPLOYEE", description="Authorized system role: EMPLOYEE, INTERN, PROJECT_MANAGER, HR_ADMIN, FINANCE_ADMIN, ADMIN")
    manager_id: Optional[str] = None
    joining_date: Optional[date] = None
    skills: Optional[List[str]] = None


class InvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    assigned_role: str
    designation: Optional[str] = None
    employment_type: str
    kapate_id: Optional[str] = None
    invitation_token: Optional[str] = None
    invitation_url: Optional[str] = None
    expires_at: datetime
    is_used: bool
    is_revoked: bool
    created_at: datetime


class InvitationVerifyResponse(BaseModel):
    is_valid: bool
    email: str
    full_name: Optional[str] = None
    designation: Optional[str] = None
    kapate_id: Optional[str] = None
    assigned_role: str
    department_name: Optional[str] = None
    error_message: Optional[str] = None


class InvitationAcceptRequest(BaseModel):
    token: str = Field(..., min_length=10)
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class RoleChangeRequest(BaseModel):
    new_role: str = Field(..., description="EMPLOYEE, INTERN, PROJECT_MANAGER, HR_ADMIN, FINANCE_ADMIN, ADMIN, SUPER_ADMIN")
    confirm_privilege_change: bool = Field(False, description="Explicit acknowledgment required for privileged roles")
    reason: Optional[str] = Field(None, max_length=500)


class UserStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="ACTIVE, SUSPENDED, DISABLED, TERMINATED")
    reason: Optional[str] = Field(None, max_length=500)


class SelfProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    phone: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=512)
    emergency_contact: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    skills: Optional[List[str]] = None


class SecurityDashboardMetrics(BaseModel):
    active_users: int
    pending_registrations: int
    active_invitations: int
    suspended_accounts: int
    total_employees: int
    total_interns: int
    total_freelancers: int
    recent_security_events: List[Any]
