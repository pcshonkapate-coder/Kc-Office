from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, Boolean, DateTime, Date, ForeignKey, Integer, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base import TimestampMixin, SoftDeleteMixin, generate_uuid


class Service(Base, TimestampMixin):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), default="Engineering", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="service")
    deals: Mapped[List["Deal"]] = relationship("Deal", back_populates="service")


class Company(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gst_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tax_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    company_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 1-10, 11-50, 51-200, 201-500, 500+
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="India")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    contacts: Mapped[List["Contact"]] = relationship("Contact", back_populates="company", cascade="all, delete-orphan")
    deals: Mapped[List["Deal"]] = relationship("Deal", back_populates="company")
    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="company")
    projects: Mapped[List["Project"]] = relationship("Project", back_populates="company")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="company")


class Contact(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role_in_buying_process: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # CEO, CTO, VP Product, Finance, Technical Lead, etc.
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="contacts")
    deals: Mapped[List["Deal"]] = relationship("Deal", back_populates="primary_contact")
    deal_associations: Mapped[List["DealContact"]] = relationship("DealContact", back_populates="contact")


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    lead_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="India")
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    service_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    service_interest: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    budget: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    budget_range: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    project_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    brief: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="Website contact form", nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)  # low, medium, high, urgent
    lead_score: Mapped[int] = mapped_column(Integer, default=50, nullable=False)  # 0 to 100
    assigned_salesperson_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="NEW LEAD", index=True, nullable=False)
    last_contacted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_follow_up_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    converted_deal_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    service: Mapped[Optional["Service"]] = relationship("Service", back_populates="leads")
    assigned_salesperson: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_salesperson_id])
    converted_deal: Mapped[Optional["Deal"]] = relationship("Deal", foreign_keys=[converted_deal_id])


class Deal(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "deals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    primary_contact_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    lead_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    service_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    pipeline_stage: Mapped[str] = mapped_column(String(50), default="NEW LEAD", index=True, nullable=False)
    # Stages:
    # NEW LEAD, QUALIFICATION, DISCOVERY BOOKED, DISCOVERY COMPLETED,
    # TECHNICAL ASSESSMENT, NDA / MSA, PROPOSAL / SOW, NEGOTIATION, CLOSED WON, CLOSED LOST
    estimated_value: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    expected_close_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    win_probability: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    owner_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="deals")
    primary_contact: Mapped[Optional["Contact"]] = relationship("Contact", back_populates="deals")
    service: Mapped[Optional["Service"]] = relationship("Service", back_populates="deals")
    owner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[owner_user_id])
    stage_history: Mapped[List["DealStageHistory"]] = relationship(
        "DealStageHistory", back_populates="deal", cascade="all, delete-orphan", order_by="DealStageHistory.created_at.desc()"
    )
    deal_contacts: Mapped[List["DealContact"]] = relationship("DealContact", back_populates="deal", cascade="all, delete-orphan")
    proposals: Mapped[List["Proposal"]] = relationship("Proposal", back_populates="deal", cascade="all, delete-orphan")
    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="deal")


class DealContact(Base, TimestampMixin):
    __tablename__ = "deal_contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    deal_id: Mapped[str] = mapped_column(String(36), ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    contact_id: Mapped[str] = mapped_column(String(36), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    role_in_deal: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    deal: Mapped["Deal"] = relationship("Deal", back_populates="deal_contacts")
    contact: Mapped["Contact"] = relationship("Contact", back_populates="deal_associations")


class DealStageHistory(Base, TimestampMixin):
    __tablename__ = "deal_stage_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    deal_id: Mapped[str] = mapped_column(String(36), ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    from_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    to_stage: Mapped[str] = mapped_column(String(50), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    deal: Mapped["Deal"] = relationship("Deal", back_populates="stage_history")
    changed_by: Mapped[Optional["User"]] = relationship("User")


class Activity(Base, TimestampMixin):
    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    entity_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # lead, deal, company, contact
    entity_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # call, email, meeting, note, follow_up, task
    subject: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="completed", nullable=False)  # pending, completed, cancelled
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    created_by: Mapped[Optional["User"]] = relationship("User")


class Meeting(Base, TimestampMixin):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    deal_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    meeting_link: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    agenda: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    minutes_of_meeting: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    organizer_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class Proposal(Base, TimestampMixin):
    __tablename__ = "proposals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    deal_id: Mapped[str] = mapped_column(String(36), ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    file_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)  # draft, sent, accepted, rejected

    # Relationships
    deal: Mapped["Deal"] = relationship("Deal", back_populates="proposals")


class Contract(Base, TimestampMixin):
    __tablename__ = "contracts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    deal_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    contract_type: Mapped[str] = mapped_column(String(50), nullable=False)  # nda, sow, msa
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)  # draft, sent, signed, expired
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    file_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Relationships
    deal: Mapped[Optional["Deal"]] = relationship("Deal", back_populates="contracts")
    company: Mapped["Company"] = relationship("Company", back_populates="contracts")
    projects: Mapped[List["Project"]] = relationship("Project", back_populates="contract")

class FollowUpReminder(Base, TimestampMixin):
    __tablename__ = "followup_reminders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False) # lead, contact, deal
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False) # PENDING, COMPLETED, CANCELLED
    
    # Relationships
    user: Mapped["User"] = relationship("User")
