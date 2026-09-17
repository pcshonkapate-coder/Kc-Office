from typing import List, Optional
from datetime import date, date as pydate, datetime
from pydantic import BaseModel, Field

# --- Expenses ---

class ExpenseBase(BaseModel):
    project_id: Optional[str] = None
    expense_category: str
    amount: float
    currency: str = "INR"
    date: Optional[pydate] = None
    description: Optional[str] = None
    receipt_url: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: str
    user_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Invoice Items ---

class InvoiceItemBase(BaseModel):
    milestone_id: Optional[str] = None
    description: str
    sac: Optional[str] = None
    quantity: float = 1.0
    unit_price: float
    total: float

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemResponse(InvoiceItemBase):
    id: str
    invoice_id: str
    
    class Config:
        from_attributes = True

# --- Invoices ---

class InvoiceBase(BaseModel):
    company_id: str
    project_id: str
    deal_id: Optional[str] = None
    invoice_number: str
    invoice_date: date
    due_date: date
    
    subtotal: float
    discount: float = 0.0
    tax_rate: float = 18.0
    tax_amount: float
    total_amount: float
    currency: str = "INR"
    
    gstin: Optional[str] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    igst: Optional[float] = None
    place_of_supply: Optional[str] = None
    is_export: bool = False
    
    payment_terms: str = "Advance"

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]

class InvoiceResponse(InvoiceBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True

# --- Payments ---

class PaymentBase(BaseModel):
    invoice_id: str
    payment_date: date
    amount: float
    currency: str = "INR"
    payment_method: str
    transaction_reference: str
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
