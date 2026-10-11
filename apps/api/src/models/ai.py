import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import (
    Base,
    GUID,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class AIAuditLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Immutable audit trail for all AI Copilot interactions and tool executions."""
    __tablename__ = "ai_audit_logs"
    __table_args__ = (
        Index("ix_ai_audit_org_created", "organization_id", "created_at"),
        Index("ix_ai_audit_user", "user_id"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    model_name: Mapped[str] = mapped_column(String(64), nullable=False)
    tools_called: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    records_accessed: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_rbac_enforced: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
