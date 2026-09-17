from typing import Optional
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, Text, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base import TimestampMixin, generate_uuid


class RegistrationRequest(Base, TimestampMixin):
    """
    Public or applicant registration request.
    Users cannot choose their role or permissions; requests start as PENDING
    and must be authorized and approved by an administrator.
    """
    __tablename__ = "registration_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    application_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    requested_type: Mapped[str] = mapped_column(String(50), default="EMPLOYEE", nullable=False)  # EMPLOYEE, INTERN, FREELANCER
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Status: PENDING, UNDER_REVIEW, APPROVED, REJECTED, EXPIRED, CANCELLED
    status: Mapped[str] = mapped_column(String(50), default="PENDING", index=True, nullable=False)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    reviewed_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class OnboardingInvitation(Base, TimestampMixin):
    """
    Cryptographically secure, single-use, time-limited onboarding invitation.
    The raw token is sent to the user via secure link and only its SHA-256 hash
    is stored in the database.
    """
    __tablename__ = "onboarding_invitations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    profile_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("person_profiles.id", ondelete="SET NULL"), nullable=True)

    # Pre-authorized parameters assigned by Admin
    assigned_role: Mapped[str] = mapped_column(String(50), default="EMPLOYEE", nullable=False)
    department_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    manager_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("person_profiles.id", ondelete="SET NULL"), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    employment_type: Mapped[str] = mapped_column(String(50), default="EMPLOYEE", nullable=False)
    kapate_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class KapateIdSequence(Base, TimestampMixin):
    """
    Atomic sequence tracker for Kapate IDs.
    Guarantees monotonic, non-colliding IDs:
    - KAP-EMP-000001
    - KAP-INT-000001
    - KAP-FRL-000001
    """
    __tablename__ = "kapate_id_sequences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(10), unique=True, index=True, nullable=False)  # EMP, INT, FRL
    current_number: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
