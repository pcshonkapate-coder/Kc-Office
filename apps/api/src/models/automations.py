import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import (
    Base,
    GUID,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class AutomationRule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "automation_rules"
    __table_args__ = (
        Index("ix_automation_rules_org", "organization_id", "is_active"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    trigger_event: Mapped[str] = mapped_column(
        String(64), nullable=False
    )  # INVOICE_OVERDUE, TASK_COMPLETED, EXPENSE_SUBMITTED, LEAVE_REQUESTED
    condition_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    action_type: Mapped[str] = mapped_column(
        String(64), nullable=False
    )  # SEND_NOTIFICATION, ADVANCE_MILESTONE, DISPATCH_WEBHOOK
    action_payload_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    logs: Mapped[list["AutomationLog"]] = relationship(
        "AutomationLog", back_populates="rule", cascade="all, delete-orphan"
    )


class AutomationLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "automation_logs"
    __table_args__ = (
        Index("ix_automation_logs_rule", "rule_id", "created_at"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    rule_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("automation_rules.id", ondelete="CASCADE"),
        nullable=False,
    )
    trigger_event: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), default="SUCCESS", nullable=False
    )  # SUCCESS, SKIPPED, FAILED
    execution_details: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    rule: Mapped["AutomationRule"] = relationship("AutomationRule", back_populates="logs")
