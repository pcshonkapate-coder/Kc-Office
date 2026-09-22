from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

# --- Safe Client Schemas ---
# These schemas explicitly omit sensitive internal fields.

class ClientDocumentResponse(BaseModel):
    id: str
    title: str
    file_type: str
    entity_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientInvoiceItemResponse(BaseModel):
    description: str
    quantity: float
    unit_price: float
    total: float

    model_config = ConfigDict(from_attributes=True)


class ClientInvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    invoice_date: date
    due_date: date
    total_amount: float
    currency: str
    status: str
    payment_terms: str
    
    items: List[ClientInvoiceItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ClientPaymentResponse(BaseModel):
    id: str
    payment_date: date
    amount: float
    currency: str
    payment_method: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class ClientTaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    due_date: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class ClientMilestoneResponse(BaseModel):
    id: str
    title: str
    start_date: Optional[date] = None
    due_date: date
    deliverable_summary: Optional[str] = None
    status: str
    completion_percentage: int
    tasks: List[ClientTaskResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ClientProjectResponse(BaseModel):
    id: str
    name: str
    project_code: str
    description: Optional[str] = None
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    # Notice: budget and actual_cost are completely omitted.
    
    milestones: List[ClientMilestoneResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ClientDashboardResponse(BaseModel):
    company_name: str
    active_projects_count: int
    pending_invoices_count: int
    recent_documents: List[ClientDocumentResponse]
