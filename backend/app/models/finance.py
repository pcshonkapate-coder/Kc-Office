from typing import List, Optional
from datetime import date
from decimal import Decimal
from sqlalchemy import String, Date, ForeignKey, Numeric, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base import TimestampMixin, SoftDeleteMixin, generate_uuid


class Expense(Base, TimestampMixin):
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expense_category: Mapped[str] = mapped_column(String(50), nullable=False)  # cloud, ai_api, gpu, software, travel, contractor, other
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    receipt_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="submitted", nullable=False)  # submitted, approved, reimbursed

    # Relationships
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="expenses")
    user: Mapped["User"] = relationship("User")


class Invoice(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    deal_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)
    
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Financial Totals
    subtotal: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    discount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("18.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    
    # GST / Export Metadata
    gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    cgst: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    sgst: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    igst: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    place_of_supply: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_export: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    payment_terms: Mapped[str] = mapped_column(String(50), default="Advance", nullable=False) # Advance, Milestone, Monthly retainer, Final payment, Custom
    status: Mapped[str] = mapped_column(String(50), default="DRAFT", index=True, nullable=False)  # DRAFT, SENT, PARTIALLY PAID, PAID, OVERDUE, CANCELLED

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="invoices")
    project: Mapped["Project"] = relationship("Project", back_populates="invoices")
    deal: Mapped[Optional["Deal"]] = relationship("Deal")
    items: Mapped[List["InvoiceItem"]] = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base, TimestampMixin):
    __tablename__ = "invoice_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    invoice_id: Mapped[str] = mapped_column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    milestone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("milestones.id", ondelete="SET NULL"), nullable=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    sac: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) # Services Accounting Code
    quantity: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=Decimal("1.00"), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    invoice_id: Mapped[str] = mapped_column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # wire_transfer, upi, stripe, cheque
    transaction_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="completed", nullable=False)  # completed, pending, failed

    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")
