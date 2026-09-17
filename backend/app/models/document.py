from typing import Optional, Any
from sqlalchemy import String, Boolean, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base import TimestampMixin, generate_uuid


class ManagedDocument(Base, TimestampMixin):
    __tablename__ = "managed_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False) # proposal, nda, msa, sow, contract, invoice, technical, other
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Polymorphic associations
    company_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    contact_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    deal_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)
    service_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    current_status: Mapped[str] = mapped_column(String(50), default="Draft", nullable=False) # Draft, Ready for Signature, Sent, Viewed, Signed, Expired
    owner_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    versions: Mapped[list["DocumentVersion"]] = relationship(
        "DocumentVersion", back_populates="document", cascade="all, delete-orphan", order_by="DocumentVersion.version_number.desc()"
    )
    signatures: Mapped[list["SignatureTracker"]] = relationship("SignatureTracker", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base, TimestampMixin):
    __tablename__ = "document_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("managed_documents.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    sections: Mapped[Any] = mapped_column(JSON, nullable=False) # Stores the structured JSON sections
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_by_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    document: Mapped["ManagedDocument"] = relationship("ManagedDocument", back_populates="versions")


class SignatureTracker(Base, TimestampMixin):
    __tablename__ = "signature_trackers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("managed_documents.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False) # docusign, zoho_sign, mock
    external_envelope_id: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False) # sent, delivered, completed, declined, voided

    # Relationships
    document: Mapped["ManagedDocument"] = relationship("ManagedDocument", back_populates="signatures")
