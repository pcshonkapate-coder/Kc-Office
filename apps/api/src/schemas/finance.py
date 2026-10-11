from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class InvoiceItemCreate(BaseModel):
    description: str = Field(..., min_length=2, max_length=255)
    quantity: int = Field(1, ge=1)
    unit_price: Decimal = Field(..., ge=0)


class InvoiceItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    invoice_id: uuid.UUID
    description: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class InvoiceCreate(BaseModel):
    account_id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    invoice_number: str = Field(..., min_length=3, max_length=64)
    issue_date: date
    due_date: date
    tax_type: str = Field("INTRA_STATE", examples=["INTRA_STATE", "INTER_STATE", "EXEMPT"])
    items: List[InvoiceItemCreate]
    notes: Optional[str] = None


class InvoiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    account_id: uuid.UUID
    invoice_number: str
    issue_date: date
    due_date: date
    subtotal: Decimal
    tax_type: str
    cgst_rate: Decimal
    cgst_amount: Decimal
    sgst_rate: Decimal
    sgst_amount: Decimal
    igst_rate: Decimal
    igst_amount: Decimal
    total_tax: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    status: str
    notes: Optional[str] = None
    created_at: datetime
    account_name: Optional[str] = None
    project_name: Optional[str] = None
    items: List[InvoiceItemRead] = []


class PaymentCreate(BaseModel):
    invoice_id: uuid.UUID
    amount_paid: Decimal = Field(..., gt=0)
    payment_date: date
    payment_method: str = Field("BANK_TRANSFER", examples=["BANK_TRANSFER", "UPI", "CARD", "CHEQUE"])
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    invoice_id: uuid.UUID
    amount_paid: Decimal
    payment_date: date
    payment_method: str
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class ExpenseCreate(BaseModel):
    project_id: Optional[uuid.UUID] = None
    title: str = Field(..., min_length=2, max_length=255)
    category: str = Field("OPERATIONAL", examples=["TRAVEL", "SOFTWARE", "HARDWARE", "OPERATIONAL", "CLIENT_ENTERTAINMENT"])
    amount: Decimal = Field(..., gt=0)
    expense_date: date
    receipt_url: Optional[str] = None


class ExpenseStatusUpdate(BaseModel):
    status: str = Field(..., examples=["APPROVED", "REJECTED", "REIMBURSED"])
    decision_notes: Optional[str] = None


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    employee_id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    title: str
    category: str
    amount: Decimal
    expense_date: date
    receipt_url: Optional[str] = None
    status: str
    decision_notes: Optional[str] = None
    created_at: datetime
    employee_name: Optional[str] = None
    project_name: Optional[str] = None


class ProjectProfitabilityRead(BaseModel):
    project_id: uuid.UUID
    project_code: str
    project_name: str
    total_budget: Decimal
    billed_revenue: Decimal
    labor_cost: Decimal
    expenses: Decimal
    gross_profit: Decimal
    margin_percentage: Decimal
    budget_consumed_percentage: Decimal
    budget_alert_level: str  # NORMAL, WARNING (70%), HIGH (85%), CRITICAL (100%)
