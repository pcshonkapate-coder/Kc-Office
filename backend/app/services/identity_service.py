import secrets
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, select

from app.models.auth import User, Role, UserRole
from app.models.workforce import PersonProfile, Employee, Intern, Freelancer, Department
from app.models.identity import RegistrationRequest, OnboardingInvitation, KapateIdSequence
from app.models.system import AuditLog, Notification
from app.schemas.identity import (
    PublicRegistrationRequestCreate, RegistrationApprovalRequest,
    AdminOnboardRequest, InvitationVerifyResponse, SecurityDashboardMetrics
)
from app.core.security import get_password_hash
from fastapi import HTTPException
from app.core.logging import logger


class IdentityService:
    def __init__(self, db: Session):
        self.db = db

    # =========================================================================
    # 1. ATOMIC UNIQUE KAPATE ID GENERATOR
    # =========================================================================
    def generate_kapate_id(self, entity_type: str) -> str:
        """
        Server-side atomic sequence generator for Kapate IDs.
        Formats:
        - Employee:   KAP-EMP-000001
        - Intern:     KAP-INT-000001
        - Freelancer: KAP-FRL-000001
        Guaranteed unique, immutable, non-colliding, and sequential.
        """
        entity_type = entity_type.upper().strip()
        if entity_type in ["EMPLOYEE", "EMP"]:
            prefix = "EMP"
        elif entity_type in ["INTERN", "INT"]:
            prefix = "INT"
        elif entity_type in ["FREELANCER", "FRL", "CONTRACTOR"]:
            prefix = "FRL"
        else:
            prefix = "EMP"

        # Query or initialize sequence counter
        seq = self.db.query(KapateIdSequence).filter(KapateIdSequence.entity_type == prefix).with_for_update().first()
        if not seq:
            # Check existing count in respective table as initial seed
            if prefix == "EMP":
                existing_count = self.db.query(func.count(Employee.id)).scalar() or 0
            elif prefix == "INT":
                existing_count = self.db.query(func.count(Intern.id)).scalar() or 0
            else:
                existing_count = self.db.query(func.count(Freelancer.id)).scalar() or 0
            
            seq = KapateIdSequence(entity_type=prefix, current_number=existing_count)
            self.db.add(seq)
            self.db.flush()

        seq.current_number += 1
        self.db.commit()
        self.db.refresh(seq)

        return f"KAP-{prefix}-{seq.current_number:06d}"

    # =========================================================================
    # 2. INTERNAL EMAIL PROVISIONER
    # =========================================================================
    def provision_internal_email(self, full_name: str) -> str:
        """
        Provisions a company-controlled email under @kapateconsultancy.com.
        Sanitizes name and prevents collision or impersonation of system addresses.
        """
        reserved = ["admin", "hr", "finance", "sales", "support", "billing", "superadmin", "security"]
        cleaned_parts = [p.lower().strip() for p in full_name.split() if p.strip()]
        if not cleaned_parts:
            base_handle = "team"
        else:
            base_handle = cleaned_parts[0]

        if base_handle in reserved:
            base_handle = f"{base_handle}.{cleaned_parts[-1]}" if len(cleaned_parts) > 1 else f"{base_handle}.staff"

        candidate = f"{base_handle}@kapateconsultancy.com"
        counter = 1
        while True:
            existing_user = self.db.query(User).filter(User.email == candidate).first()
            existing_profile = self.db.query(PersonProfile).filter(PersonProfile.internal_email == candidate).first()
            if not existing_user and not existing_profile:
                return candidate
            counter += 1
            candidate = f"{base_handle}{counter:02d}@kapateconsultancy.com"

    # =========================================================================
    # 3. PUBLIC REGISTRATION REQUESTS (NO ROLE SELECTION PERMITTED)
    # =========================================================================
    def create_registration_request(self, data: PublicRegistrationRequestCreate) -> RegistrationRequest:
        """
        Public applicant registration. Role and permissions can NEVER be chosen.
        Request is saved with status PENDING for admin review.
        """
        if data.password != data.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match.")

        # Check existing user
        existing_user = self.db.query(User).filter(User.email == data.email.lower().strip()).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="An account with this email address already exists.")

        # Check existing pending request
        pending = self.db.query(RegistrationRequest).filter(
            RegistrationRequest.email == data.email.lower().strip(),
            RegistrationRequest.status == "PENDING"
        ).first()
        if pending:
            raise HTTPException(status_code=400, detail="A registration request for this email is already under review.")

        req = RegistrationRequest(
            full_name=data.full_name.strip(),
            email=data.email.lower().strip(),
            phone=data.phone.strip() if data.phone else None,
            application_id=data.application_id.strip() if data.application_id else None,
            requested_type=data.requested_type.upper().strip() if data.requested_type else "EMPLOYEE",
            notes=data.notes,
            password_hash=get_password_hash(data.password),
            status="PENDING"
        )
        self.db.add(req)
        self.db.commit()
        self.db.refresh(req)

        # Log security event
        self._log_audit(
            actor_user_id=None,
            action="REGISTRATION_REQUEST_CREATED",
            entity_name="registration_request",
            entity_id=req.id,
            new_values={"email": req.email, "full_name": req.full_name, "requested_type": req.requested_type}
        )

        return req

    # =========================================================================
    # 4. REGISTRATION APPROVAL & ONBOARDING INVITATION
    # =========================================================================
    def approve_registration_request(
        self, request_id: str, admin_user: User, approval: RegistrationApprovalRequest
    ) -> Dict[str, Any]:
        """
        Admin reviews and approves an applicant request, assigning their system role,
        department, manager, generating their Kapate ID, and creating an onboarding invitation.
        """
        req = self.db.query(RegistrationRequest).filter(RegistrationRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Registration request not found.")

        if req.status != "PENDING" and req.status != "UNDER_REVIEW":
            raise HTTPException(status_code=400, detail=f"Request is already {req.status}.")

        entity_type = approval.employment_type.upper().strip()
        kapate_id = self.generate_kapate_id(entity_type)
        internal_email = self.provision_internal_email(req.full_name)

        # Generate single-use secure random token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=72)

        # Create Profile in INVITED state
        if entity_type == "INTERN":
            profile = Intern(
                name=req.full_name,
                email=req.email,
                phone=req.phone,
                department_id=approval.department_id,
                manager_id=approval.manager_id,
                designation=approval.designation,
                status="INVITED",
                kapate_id=kapate_id,
                internal_email=internal_email,
                intern_id=kapate_id,
                internship_status="SELECTED"
            )
        elif entity_type == "FREELANCER":
            profile = Freelancer(
                name=req.full_name,
                email=req.email,
                phone=req.phone,
                department_id=approval.department_id,
                manager_id=approval.manager_id,
                designation=approval.designation,
                status="INVITED",
                kapate_id=kapate_id,
                internal_email=internal_email
            )
        else:
            profile = Employee(
                name=req.full_name,
                email=req.email,
                phone=req.phone,
                department_id=approval.department_id,
                manager_id=approval.manager_id,
                designation=approval.designation,
                status="INVITED",
                kapate_id=kapate_id,
                internal_email=internal_email,
                employee_id=kapate_id,
                employment_type=approval.employment_type
            )

        self.db.add(profile)
        self.db.flush()

        # Create invitation record
        invitation = OnboardingInvitation(
            token_hash=token_hash,
            email=req.email,
            profile_id=profile.id,
            assigned_role=approval.role.upper().strip(),
            department_id=approval.department_id,
            manager_id=approval.manager_id,
            designation=approval.designation,
            employment_type=approval.employment_type,
            kapate_id=kapate_id,
            expires_at=expires_at,
            created_by_user_id=admin_user.id
        )
        self.db.add(invitation)

        # Update registration request status
        req.status = "APPROVED"
        req.reviewed_by_user_id = admin_user.id
        req.reviewed_at = datetime.now(timezone.utc)

        self.db.commit()

        # Log audit
        self._log_audit(
            actor_user_id=admin_user.id,
            action="REGISTRATION_APPROVED",
            entity_name="registration_request",
            entity_id=req.id,
            new_values={
                "kapate_id": kapate_id,
                "internal_email": internal_email,
                "role": approval.role,
                "designation": approval.designation
            }
        )

        invitation_url = f"/invite?token={raw_token}"
        return {
            "request_id": req.id,
            "kapate_id": kapate_id,
            "internal_email": internal_email,
            "invitation_token": raw_token,
            "invitation_url": invitation_url,
            "expires_at": expires_at.isoformat()
        }

    def reject_registration_request(self, request_id: str, admin_user: User, reason: Optional[str]) -> Dict[str, Any]:
        req = self.db.query(RegistrationRequest).filter(RegistrationRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Registration request not found.")

        req.status = "REJECTED"
        req.rejection_reason = reason
        req.reviewed_by_user_id = admin_user.id
        req.reviewed_at = datetime.now(timezone.utc)
        self.db.commit()

        self._log_audit(
            actor_user_id=admin_user.id,
            action="REGISTRATION_REJECTED",
            entity_name="registration_request",
            entity_id=req.id,
            new_values={"reason": reason}
        )
        return {"id": req.id, "status": "REJECTED", "reason": reason}

    # =========================================================================
    # 5. ADMIN DIRECT ONBOARDING
    # =========================================================================
    def admin_onboard_personnel(self, admin_user: User, data: AdminOnboardRequest) -> Dict[str, Any]:
        """
        Direct onboarding flow initiated by Admin / HR.
        Assigns authorized role, creates profile, generates Kapate ID & internal email,
        and produces a single-use onboarding invitation.
        """
        entity_type = data.employment_type.upper().strip()
        kapate_id = self.generate_kapate_id(entity_type)
        internal_email = self.provision_internal_email(data.full_name)

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=72)

        if entity_type == "INTERN":
            profile = Intern(
                name=data.full_name.strip(),
                email=data.email.lower().strip(),
                phone=data.phone,
                department_id=data.department_id,
                manager_id=data.manager_id,
                designation=data.designation,
                status="INVITED",
                kapate_id=kapate_id,
                internal_email=internal_email,
                intern_id=kapate_id,
                skills=data.skills or []
            )
        elif entity_type == "FREELANCER":
            profile = Freelancer(
                name=data.full_name.strip(),
                email=data.email.lower().strip(),
                phone=data.phone,
                department_id=data.department_id,
                manager_id=data.manager_id,
                designation=data.designation,
                status="INVITED",
                kapate_id=kapate_id,
                internal_email=internal_email,
                skills=data.skills or []
            )
        else:
            profile = Employee(
                name=data.full_name.strip(),
                email=data.email.lower().strip(),
                phone=data.phone,
                department_id=data.department_id,
                manager_id=data.manager_id,
                designation=data.designation,
                status="INVITED",
                kapate_id=kapate_id,
                internal_email=internal_email,
                employee_id=kapate_id,
                employment_type=data.employment_type,
                skills=data.skills or []
            )

        self.db.add(profile)
        self.db.flush()

        invitation = OnboardingInvitation(
            token_hash=token_hash,
            email=data.email.lower().strip(),
            profile_id=profile.id,
            assigned_role=data.role.upper().strip(),
            department_id=data.department_id,
            manager_id=data.manager_id,
            designation=data.designation,
            employment_type=data.employment_type,
            kapate_id=kapate_id,
            expires_at=expires_at,
            created_by_user_id=admin_user.id
        )
        self.db.add(invitation)
        self.db.commit()

        self._log_audit(
            actor_user_id=admin_user.id,
            action="ONBOARD_PERSONNEL_CREATED",
            entity_name="person_profile",
            entity_id=profile.id,
            new_values={
                "kapate_id": kapate_id,
                "internal_email": internal_email,
                "role": data.role,
                "designation": data.designation
            }
        )

        invitation_url = f"/invite?token={raw_token}"
        return {
            "profile_id": profile.id,
            "kapate_id": kapate_id,
            "internal_email": internal_email,
            "invitation_token": raw_token,
            "invitation_url": invitation_url,
            "expires_at": expires_at.isoformat()
        }

    # =========================================================================
    # 6. INVITATION VERIFICATION & ACCEPTANCE
    # =========================================================================
    def verify_invitation_token(self, token: str) -> InvitationVerifyResponse:
        """
        Validates the single-use token against expiration, revocation, and prior use.
        """
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        inv = self.db.query(OnboardingInvitation).filter(OnboardingInvitation.token_hash == token_hash).first()
        if not inv:
            return InvitationVerifyResponse(
                is_valid=False, email="", assigned_role="", error_message="Invalid invitation token."
            )

        if inv.is_revoked:
            return InvitationVerifyResponse(
                is_valid=False, email=inv.email, assigned_role=inv.assigned_role, error_message="This invitation has been revoked by administration."
            )

        if inv.is_used:
            return InvitationVerifyResponse(
                is_valid=False, email=inv.email, assigned_role=inv.assigned_role, error_message="This invitation has already been accepted."
            )

        now = datetime.now(timezone.utc)
        exp = inv.expires_at if inv.expires_at.tzinfo else inv.expires_at.replace(tzinfo=timezone.utc)
        if exp < now:
            return InvitationVerifyResponse(
                is_valid=False, email=inv.email, assigned_role=inv.assigned_role, error_message="This invitation has expired. Contact administration for a fresh link."
            )

        profile = self.db.query(PersonProfile).filter(PersonProfile.id == inv.profile_id).first() if inv.profile_id else None
        dept = self.db.query(Department).filter(Department.id == inv.department_id).first() if inv.department_id else None

        return InvitationVerifyResponse(
            is_valid=True,
            email=inv.email,
            full_name=profile.name if profile else None,
            designation=inv.designation,
            kapate_id=inv.kapate_id,
            assigned_role=inv.assigned_role,
            department_name=dept.name if dept else None
        )

    def accept_invitation(self, token: str, password: str, confirm_password: str) -> Dict[str, Any]:
        """
        Finalizes registration: verifies token, creates User credentials, assigns
        admin-selected role, links PersonProfile, marks invitation used, and activates account.
        """
        if password != confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match.")

        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        inv = self.db.query(OnboardingInvitation).filter(OnboardingInvitation.token_hash == token_hash).first()
        if not inv or inv.is_revoked or inv.is_used:
            raise HTTPException(status_code=400, detail="Invalid, expired, or already-used invitation token.")

        now = datetime.now(timezone.utc)
        exp = inv.expires_at if inv.expires_at.tzinfo else inv.expires_at.replace(tzinfo=timezone.utc)
        if exp < now:
            raise HTTPException(status_code=400, detail="This invitation has expired.")

        profile = self.db.query(PersonProfile).filter(PersonProfile.id == inv.profile_id).first() if inv.profile_id else None
        user_name = profile.name if profile else inv.email.split("@")[0].title()

        # Check existing user
        user = self.db.query(User).filter(User.email == inv.email).first()
        if not user:
            user = User(
                email=inv.email,
                hashed_password=get_password_hash(password),
                full_name=user_name,
                is_active=True,
                is_verified=True
            )
            self.db.add(user)
            self.db.flush()
        else:
            user.hashed_password = get_password_hash(password)
            user.is_active = True
            user.is_verified = True

        # Assign Role (lower case lookup matching system roles)
        role_lookup = inv.assigned_role.lower()
        if role_lookup == "project_manager":
            role_lookup = "consultant"
        elif role_lookup in ["admin", "hr_admin", "finance_admin"]:
            role_lookup = "superadmin"
        elif role_lookup == "intern":
            role_lookup = "intern"
        else:
            role_lookup = "engineer"

        role_record = self.db.query(Role).filter(Role.name == role_lookup).first()
        if not role_record:
            role_record = self.db.query(Role).filter(Role.name == "engineer").first()

        if role_record and role_record not in user.roles:
            user.roles.append(role_record)

        # Mark invitation used
        inv.is_used = True
        inv.used_at = datetime.now(timezone.utc)
        inv.user_id = user.id

        # Update profile to ACTIVE and link user_id
        if profile:
            profile.user_id = user.id
            profile.status = "ACTIVE"

        # Send welcome notification
        notif = Notification(
            user_id=user.id,
            title="Welcome to Kapate OS",
            message=f"Your account is activated with Kapate ID {inv.kapate_id or 'Assigned'}. Welcome to the team!",
            notification_type="success",
            link="/dashboard"
        )
        self.db.add(notif)
        self.db.commit()

        self._log_audit(
            actor_user_id=user.id,
            action="INVITATION_ACCEPTED",
            entity_name="user",
            entity_id=user.id,
            new_values={"role": inv.assigned_role, "kapate_id": inv.kapate_id}
        )

        return {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "kapate_id": inv.kapate_id,
            "assigned_role": inv.assigned_role,
            "status": "ACTIVE"
        }

    # =========================================================================
    # 7. ROLE & STATUS MANAGEMENT (ADMIN ONLY, NO ESCALATION)
    # =========================================================================
    def change_user_role(self, target_user_id: str, new_role_name: str, admin_user: User, confirm_privilege_change: bool = False) -> Dict[str, Any]:
        """
        Only authorized administrators can reassign roles.
        Self-promotion is strictly rejected. Privileged roles require confirmation.
        """
        if target_user_id == admin_user.id:
            raise HTTPException(status_code=403, detail="Self-role modification is strictly forbidden.")

        target_user = self.db.query(User).filter(User.id == target_user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found.")

        old_roles = [r.name for r in target_user.roles]

        target_role_clean = new_role_name.lower().strip()
        if target_role_clean in ["super_admin", "superadmin", "admin"] and not confirm_privilege_change:
            raise HTTPException(
                status_code=400,
                detail="Assigning administrative privileges requires explicit confirmation (confirm_privilege_change=True)."
            )

        role_obj = self.db.query(Role).filter(Role.name == target_role_clean).first()
        if not role_obj:
            # Fallback to engineer
            role_obj = self.db.query(Role).filter(Role.name == "engineer").first()

        target_user.roles = [role_obj]
        self.db.commit()

        self._log_audit(
            actor_user_id=admin_user.id,
            action="ROLE_CHANGED",
            entity_name="user",
            entity_id=target_user.id,
            old_values={"roles": old_roles},
            new_values={"roles": [role_obj.name]}
        )

        return {"user_id": target_user.id, "new_roles": [role_obj.name]}

    def update_user_status(self, target_user_id: str, new_status: str, admin_user: User, reason: Optional[str]) -> Dict[str, Any]:
        """
        Transitions user account status: ACTIVE, SUSPENDED, DISABLED, TERMINATED.
        Immediately revokes active sessions when suspended or terminated.
        """
        target_user = self.db.query(User).filter(User.id == target_user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found.")

        valid_statuses = ["ACTIVE", "SUSPENDED", "DISABLED", "TERMINATED"]
        new_status = new_status.upper().strip()
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Choose from {valid_statuses}")

        old_status = "ACTIVE" if target_user.is_active else "SUSPENDED"

        if new_status in ["SUSPENDED", "DISABLED", "TERMINATED"]:
            target_user.is_active = False
        else:
            target_user.is_active = True

        profile = self.db.query(PersonProfile).filter(PersonProfile.user_id == target_user.id).first()
        if profile:
            profile.status = new_status

        self.db.commit()

        self._log_audit(
            actor_user_id=admin_user.id,
            action=f"ACCOUNT_STATUS_{new_status}",
            entity_name="user",
            entity_id=target_user.id,
            old_values={"status": old_status},
            new_values={"status": new_status, "reason": reason}
        )

        return {"user_id": target_user.id, "status": new_status, "is_active": target_user.is_active}

    # =========================================================================
    # 8. SECURITY DASHBOARD METRICS
    # =========================================================================
    def get_security_dashboard(self) -> SecurityDashboardMetrics:
        active_users = self.db.query(User).filter(User.is_active == True).count()
        suspended_accounts = self.db.query(User).filter(User.is_active == False).count()
        pending_registrations = self.db.query(RegistrationRequest).filter(RegistrationRequest.status == "PENDING").count()
        active_invitations = self.db.query(OnboardingInvitation).filter(
            OnboardingInvitation.is_used == False,
            OnboardingInvitation.is_revoked == False
        ).count()

        total_emp = self.db.query(Employee).count()
        total_int = self.db.query(Intern).count()
        total_frl = self.db.query(Freelancer).count()

        recent_logs = self.db.query(AuditLog).filter(
            AuditLog.action.in_([
                "REGISTRATION_REQUEST_CREATED", "REGISTRATION_APPROVED", "REGISTRATION_REJECTED",
                "ONBOARD_PERSONNEL_CREATED", "INVITATION_ACCEPTED", "ROLE_CHANGED",
                "ACCOUNT_STATUS_SUSPENDED", "ACCOUNT_STATUS_ACTIVE", "ACCOUNT_STATUS_TERMINATED"
            ])
        ).order_by(AuditLog.created_at.desc()).limit(20).all()

        events_formatted = [
            {
                "id": l.id,
                "action": l.action,
                "entity_name": l.entity_name,
                "entity_id": l.entity_id,
                "actor_id": l.user_id,
                "new_values": l.new_values,
                "created_at": l.created_at.isoformat() if l.created_at else None
            }
            for l in recent_logs
        ]

        return SecurityDashboardMetrics(
            active_users=active_users,
            pending_registrations=pending_registrations,
            active_invitations=active_invitations,
            suspended_accounts=suspended_accounts,
            total_employees=total_emp,
            total_interns=total_int,
            total_freelancers=total_frl,
            recent_security_events=events_formatted
        )

    # =========================================================================
    # HELPER: AUDIT LOGGING
    # =========================================================================
    def _log_audit(
        self,
        actor_user_id: Optional[str],
        action: str,
        entity_name: str,
        entity_id: str,
        old_values: Optional[Any] = None,
        new_values: Optional[Any] = None
    ) -> None:
        log = AuditLog(
            user_id=actor_user_id,
            action=action,
            entity_name=entity_name,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values
        )
        self.db.add(log)
        self.db.commit()
