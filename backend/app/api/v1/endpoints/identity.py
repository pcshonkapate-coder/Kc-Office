from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_active_user, require_role
from app.models.auth import User
from app.models.identity import RegistrationRequest, OnboardingInvitation
from app.schemas.identity import (
    PublicRegistrationRequestCreate, RegistrationRequestResponse,
    RegistrationApprovalRequest, RegistrationRejectRequest,
    AdminOnboardRequest, InvitationResponse, InvitationVerifyResponse,
    InvitationAcceptRequest, RoleChangeRequest, UserStatusUpdateRequest,
    SelfProfileUpdateRequest, SecurityDashboardMetrics
)
from app.services.identity_service import IdentityService
from app.models.workforce import PersonProfile

router = APIRouter()


def get_identity_service(db: Session = Depends(get_db)) -> IdentityService:
    return IdentityService(db)


def is_admin_or_hr(user: User) -> bool:
    for role in user.roles:
        if role.name in ["superadmin", "partner", "ADMIN", "SUPER_ADMIN", "HR_ADMIN"]:
            return True
    return False


# =============================================================================
# PUBLIC ONBOARDING & REGISTRATION ENDPOINTS
# =============================================================================

@router.post("/register-request", response_model=RegistrationRequestResponse, status_code=status.HTTP_201_CREATED, tags=["Identity & Onboarding"])
def submit_registration_request(
    data: PublicRegistrationRequestCreate,
    service: IdentityService = Depends(get_identity_service)
):
    """
    Public registration endpoint.
    Users cannot choose their role, permissions, or Kapate ID.
    The request is registered in PENDING status for administrator review.
    """
    return service.create_registration_request(data)


@router.get("/invite/verify", response_model=InvitationVerifyResponse, status_code=status.HTTP_200_OK, tags=["Identity & Onboarding"])
def verify_invitation(
    token: str = Query(..., min_length=10, description="Cryptographic invitation token"),
    service: IdentityService = Depends(get_identity_service)
):
    """
    Verifies that an onboarding invitation token is valid, unexpired, and unused.
    """
    return service.verify_invitation_token(token)


@router.post("/invite/accept", status_code=status.HTTP_200_OK, tags=["Identity & Onboarding"])
def accept_invitation(
    payload: InvitationAcceptRequest,
    service: IdentityService = Depends(get_identity_service)
):
    """
    Accepts invitation, sets password, activates account, and provisions internal mailbox.
    """
    return service.accept_invitation(payload.token, payload.password, payload.confirm_password)


# =============================================================================
# ADMIN REGISTRATION QUEUE & ONBOARDING
# =============================================================================

@router.get("/registration-requests", response_model=List[RegistrationRequestResponse], tags=["Identity & Onboarding"])
def list_registration_requests(
    status_filter: Optional[str] = Query(None, description="PENDING, APPROVED, REJECTED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: IdentityService = Depends(get_identity_service)
):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Access denied. Admin or HR privileges required.")

    query = db.query(RegistrationRequest)
    if status_filter:
        query = query.filter(RegistrationRequest.status == status_filter.upper())
    return query.order_by(RegistrationRequest.created_at.desc()).all()


@router.post("/registration-requests/{request_id}/approve", status_code=status.HTTP_200_OK, tags=["Identity & Onboarding"])
def approve_registration_request(
    request_id: str,
    approval: RegistrationApprovalRequest,
    current_user: User = Depends(get_current_active_user),
    service: IdentityService = Depends(get_identity_service)
):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only authorized administrators can approve registrations.")
    return service.approve_registration_request(request_id, current_user, approval)


@router.post("/registration-requests/{request_id}/reject", status_code=status.HTTP_200_OK, tags=["Identity & Onboarding"])
def reject_registration_request(
    request_id: str,
    rejection: RegistrationRejectRequest,
    current_user: User = Depends(get_current_active_user),
    service: IdentityService = Depends(get_identity_service)
):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only authorized administrators can reject registrations.")
    return service.reject_registration_request(request_id, current_user, rejection.reason)


@router.post("/onboard", status_code=status.HTTP_201_CREATED, tags=["Identity & Onboarding"])
def admin_onboard_personnel(
    data: AdminOnboardRequest,
    current_user: User = Depends(get_current_active_user),
    service: IdentityService = Depends(get_identity_service)
):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only authorized administrators can onboard personnel.")
    return service.admin_onboard_personnel(current_user, data)


@router.get("/invitations", response_model=List[InvitationResponse], tags=["Identity & Onboarding"])
def list_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Access denied. Admin or HR privileges required.")
    return db.query(OnboardingInvitation).order_by(OnboardingInvitation.created_at.desc()).all()


@router.post("/invitations/{invitation_id}/revoke", status_code=status.HTTP_200_OK, tags=["Identity & Onboarding"])
def revoke_invitation(
    invitation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: IdentityService = Depends(get_identity_service)
):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Access denied. Admin or HR privileges required.")

    inv = db.query(OnboardingInvitation).filter(OnboardingInvitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    inv.is_revoked = True
    db.commit()
    return {"message": "Invitation revoked successfully."}


# =============================================================================
# ROLE & PRIVILEGE ENFORCEMENT
# =============================================================================

@router.patch("/users/{user_id}/role", status_code=status.HTTP_200_OK, tags=["Identity & Onboarding"])
def change_user_role(
    user_id: str,
    payload: RoleChangeRequest,
    current_user: User = Depends(get_current_active_user),
    service: IdentityService = Depends(get_identity_service)
):
    """
    Assigns or updates a user's system role.
    Self-promotion is strictly rejected with 403 Forbidden.
    """
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Access denied. Admin role required to modify user roles.")
    return service.change_user_role(user_id, payload.new_role, current_user, payload.confirm_privilege_change)


@router.patch("/users/{user_id}/status", status_code=status.HTTP_200_OK, tags=["Identity & Onboarding"])
def update_user_status(
    user_id: str,
    payload: UserStatusUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    service: IdentityService = Depends(get_identity_service)
):
    """
    Suspends, deactivates, or terminates a user account with immediate session revocation.
    """
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Access denied. Admin role required to modify account status.")
    return service.update_user_status(user_id, payload.status, current_user, payload.reason)


# =============================================================================
# SELF PROFILE UPDATING (ZERO PRIVILEGE TAMPERING)
# =============================================================================

@router.patch("/users/me", status_code=status.HTTP_200_OK, tags=["Identity & Onboarding"])
def update_my_profile(
    payload: SelfProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Updates whitelisted personal profile fields (avatar, phone, emergency contact, notes, skills).
    Role, permissions, and Kapate ID cannot be changed here.
    """
    profile = db.query(PersonProfile).filter(PersonProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Workforce profile not found.")

    dump = payload.model_dump(exclude_unset=True)
    if "phone" in dump:
        profile.phone = dump["phone"]
        current_user.phone = dump["phone"]
    if "avatar_url" in dump:
        profile.avatar_url = dump["avatar_url"]
        current_user.avatar_url = dump["avatar_url"]
    if "emergency_contact" in dump:
        profile.emergency_contact = dump["emergency_contact"]
    if "notes" in dump:
        profile.notes = dump["notes"]
    if "skills" in dump:
        profile.skills = dump["skills"]

    db.commit()
    return {"message": "Profile updated successfully."}


@router.patch("/users/{user_id}", status_code=status.HTTP_200_OK, tags=["Identity & Onboarding"])
def update_other_user_profile(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Blocks non-admin users from tampering with another user's profile or permissions.
    """
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Forbidden. You do not have permission to modify other personnel.")

    # Admins modifying basic profile fields
    profile = db.query(PersonProfile).filter(PersonProfile.id == user_id).first()
    if not profile:
        profile = db.query(PersonProfile).filter(PersonProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found.")

    for k, v in payload.items():
        if hasattr(profile, k) and k not in ["id", "kapate_id", "employee_id", "intern_id"]:
            setattr(profile, k, v)

    db.commit()
    return {"message": "User profile updated by administrator."}


# =============================================================================
# SECURITY COMMAND CENTER
# =============================================================================

@router.get("/security-dashboard", response_model=SecurityDashboardMetrics, status_code=status.HTTP_200_OK, tags=["Identity & Onboarding"])
def get_security_dashboard(
    current_user: User = Depends(get_current_active_user),
    service: IdentityService = Depends(get_identity_service)
):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Access denied. Admin privileges required.")
    return service.get_security_dashboard()
