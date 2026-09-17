from typing import Optional, Dict, Any
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base import TimestampMixin, generate_uuid


class AIAuditLog(Base, TimestampMixin):
    __tablename__ = "ai_audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    feature: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    input_reference: Mapped[Optional[str]] = mapped_column(String(512), nullable=True) # E.g., Lead ID, Project ID
    output_preview: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True) # A short summary of the output
    model_used: Mapped[str] = mapped_column(String(100), nullable=False)
    usage_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True) # Prompt tokens, completion tokens, cost
    
    # Relationships
    user: Mapped["User"] = relationship("User")


class AIDraft(Base, TimestampMixin):
    __tablename__ = "ai_drafts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    entity_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # E.g., meeting, project, lead
    feature: Mapped[str] = mapped_column(String(100), nullable=False)
    draft_content: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED, EDITED
    
    # Relationships
    user: Mapped["User"] = relationship("User")
