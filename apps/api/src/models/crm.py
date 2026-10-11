import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import (
    Base,
    GUID,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class Account(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "accounts"
    __table_args__ = (
        Index("ix_accounts_org", "organization_id"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str] = mapped_column(String(128), default="Technology", nullable=False)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tier: Mapped[str] = mapped_column(
        String(32), default="GROWTH", nullable=False
    )  # ENTERPRISE, GROWTH, STARTUP
    status: Mapped[str] = mapped_column(
        String(32), default="ACTIVE", nullable=False
    )  # PROSPECT, ACTIVE, CHURNED, DORMANT
    total_revenue: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )

    # Relationships
    contacts: Mapped[List["Contact"]] = relationship("Contact", back_populates="account", cascade="all, delete-orphan")
    opportunities: Mapped[List["Opportunity"]] = relationship("Opportunity", back_populates="account")
    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="account")


class Contact(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "contacts"
    __table_args__ = (
        Index("ix_contacts_account", "account_id"),
    )

    account_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    first_name: Mapped[str] = mapped_column(String(128), nullable=False)
    last_name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    account: Mapped["Account"] = relationship("Account", back_populates="contacts")


class Lead(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "leads"
    __table_args__ = (
        Index("ix_leads_org_status", "organization_id", "status"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[str] = mapped_column(
        String(64), default="WEBSITE", nullable=False
    )  # WEBSITE, REFERRAL, OUTREACH, EVENT, PARTNER
    status: Mapped[str] = mapped_column(
        String(32), default="NEW", nullable=False
    )  # NEW, QUALIFIED, CONTACTED, UNQUALIFIED, CONVERTED
    estimated_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )
    assigned_to_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )


class Opportunity(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "opportunities"
    __table_args__ = (
        Index("ix_opportunities_account_stage", "account_id", "stage"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    stage: Mapped[str] = mapped_column(
        String(32), default="DISCOVERY", nullable=False
    )  # DISCOVERY, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
    contract_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )
    win_probability: Mapped[int] = mapped_column(default=20, nullable=False)  # 0 to 100%
    expected_close_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    account: Mapped["Account"] = relationship("Account", back_populates="opportunities")
    proposals: Mapped[List["Proposal"]] = relationship("Proposal", back_populates="opportunity", cascade="all, delete-orphan")


class Proposal(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "proposals"
    __table_args__ = (
        UniqueConstraint("opportunity_id", "proposal_number", name="uq_proposal_number"),
    )

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
    )
    proposal_number: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), default="DRAFT", nullable=False
    )  # DRAFT, SENT, ACCEPTED, DECLINED
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    valid_until: Mapped[date] = mapped_column(Date, nullable=False)
    scope_of_work: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    opportunity: Mapped["Opportunity"] = relationship("Opportunity", back_populates="proposals")
    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="proposal")


class Contract(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "contracts"
    __table_args__ = (
        UniqueConstraint("organization_id", "contract_number", name="uq_contract_number"),
        Index("ix_contracts_account", "account_id"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    proposal_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("proposals.id", ondelete="SET NULL"),
        nullable=True,
    )
    contract_number: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), default="DRAFT", nullable=False
    )  # DRAFT, PENDING_SIGNATURE, ACTIVE, EXPIRED, TERMINATED
    total_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    signer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    signer_ip: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    digital_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    # Relationships
    account: Mapped["Account"] = relationship("Account", back_populates="contracts")
    proposal: Mapped[Optional["Proposal"]] = relationship("Proposal", back_populates="contracts")
