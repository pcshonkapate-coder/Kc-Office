from typing import Optional
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base import TimestampMixin, generate_uuid


class OTPToken(Base, TimestampMixin):
    """
    Model for tracking One-Time Passwords (OTP) issued for employees and users.
    Supports email and SMS identifiers, expiration TTL, attempt counts, and single-use invalidation.
    """
    __tablename__ = "otp_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    identifier: Mapped[str] = mapped_column(String(255), index=True, nullable=False) # Email or Phone number
    otp_code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(String(50), default="LOGIN", nullable=False) # LOGIN, VERIFY, 2FA, ATTENDANCE
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    attempts_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        Index("idx_otp_identifier_purpose", "identifier", "purpose"),
    )
