from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field


# --- Configurable Services ---
class ServiceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category: str = Field("Engineering", max_length=100)
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class ServiceResponse(ServiceBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Contacts ---
class ContactBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    role_in_buying_process: Optional[str] = Field(None, max_length=100)
    # Roles: CEO, CTO, VP Product, Finance, Technical Lead, Decision Maker, Champion, Influencer, End User
    is_primary: bool = False
    notes: Optional[str] = None


class ContactCreate(ContactBase):
    company_id: str


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    role_in_buying_process: Optional[str] = None
    is_primary: Optional[bool] = None
    notes: Optional[str] = None


class ContactResponse(ContactBase):
    id: str
    company_id: str
    company_name: Optional[str] = None
    designation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Companies ---
class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    domain: Optional[str] = Field(None, max_length=100)
    gst_number: Optional[str] = Field(None, max_length=50)
    tax_id: Optional[str] = Field(None, max_length=100)
    company_size: Optional[str] = Field(None, max_length=50)  # 1-10, 11-50, 51-200, 201-500, 500+
    source: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    country: str = Field("India", max_length=100)
    notes: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    domain: Optional[str] = None
    gst_number: Optional[str] = None
    tax_id: Optional[str] = None
    company_size: Optional[str] = None
    source: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None


class CompanyResponse(CompanyBase):
    id: str
    contacts_count: int = 0
    deals_count: int = 0
    total_deal_value: Decimal = Decimal("0.00")
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyDetailResponse(CompanyResponse):
    contacts: List[ContactResponse] = []


# --- Leads ---
class PublicLeadCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    company: Optional[str] = Field(None, max_length=255)
    service: Optional[str] = Field(None, max_length=100)
    budget: Optional[str] = Field(None, max_length=100)
    message: str = Field(..., min_length=5, max_length=5000)
    # Honeypot field (must be blank for valid submissions)
    hp_website_company_fax: Optional[str] = Field(None, max_length=100)
    # Optional captcha token for Turnstile / reCAPTCHA compatibility
    captcha_token: Optional[str] = Field(None, max_length=1000)


class PublicSubmissionResponse(BaseModel):
    success: bool = True
    message: str = "Thank you. Your consultation request has been received. Our team will contact you shortly."
    lead_code: str
    is_duplicate: bool = False
    created_at: datetime


class LeadBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    company_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    country: str = Field("India", max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)
    service_id: Optional[str] = None
    service_interest: Optional[str] = Field(None, max_length=100)
    budget: Optional[str] = Field(None, max_length=100)
    currency: str = Field("INR", max_length=10)
    project_description: Optional[str] = None
    source: str = Field("Manual entry", max_length=50)
    # Sources: Website contact form, Consultation form, Referral, Email, LinkedIn, Cold outreach, Manual entry, Other
    priority: str = Field("medium", max_length=20)  # low, medium, high, urgent
    lead_score: int = Field(50, ge=0, le=100)
    assigned_salesperson_id: Optional[str] = None
    status: str = Field("NEW LEAD", max_length=50)
    # status: NEW LEAD, QUALIFICATION, DISCOVERY BOOKED, DISCOVERY COMPLETED, qualified, contacted, disqualified, converted
    last_contacted_at: Optional[datetime] = None
    next_follow_up_at: Optional[datetime] = None
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    job_title: Optional[str] = None
    service_id: Optional[str] = None
    service_interest: Optional[str] = None
    budget: Optional[str] = None
    currency: Optional[str] = None
    project_description: Optional[str] = None
    source: Optional[str] = None
    priority: Optional[str] = None
    lead_score: Optional[int] = Field(None, ge=0, le=100)
    assigned_salesperson_id: Optional[str] = None
    status: Optional[str] = None
    last_contacted_at: Optional[datetime] = None
    next_follow_up_at: Optional[datetime] = None
    notes: Optional[str] = None


class LeadConvertRequest(BaseModel):
    deal_title: Optional[str] = None
    estimated_value: Optional[Decimal] = Decimal("0.00")
    currency: Optional[str] = "INR"
    expected_close_date: Optional[date] = None
    pipeline_stage: Optional[str] = "QUALIFICATION"
    assigned_owner_id: Optional[str] = None


class LeadResponse(LeadBase):
    id: str
    lead_code: str
    contact_name: str
    service_name: Optional[str] = None
    assigned_salesperson_name: Optional[str] = None
    converted_deal_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Deals ---
class DealBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    company_id: str
    primary_contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    service_id: Optional[str] = None
    estimated_value: Decimal = Field(Decimal("0.00"), ge=0)
    currency: str = Field("INR", max_length=10)
    expected_close_date: Optional[date] = None
    pipeline_stage: str = Field("NEW LEAD", max_length=50)
    win_probability: int = Field(50, ge=0, le=100)
    owner_user_id: Optional[str] = None
    notes: Optional[str] = None


class DealCreate(DealBase):
    contact_ids: Optional[List[str]] = []


class DealUpdate(BaseModel):
    title: Optional[str] = None
    company_id: Optional[str] = None
    primary_contact_id: Optional[str] = None
    service_id: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    currency: Optional[str] = None
    expected_close_date: Optional[date] = None
    pipeline_stage: Optional[str] = None
    win_probability: Optional[int] = Field(None, ge=0, le=100)
    owner_user_id: Optional[str] = None
    notes: Optional[str] = None


class DealStageChangeRequest(BaseModel):
    pipeline_stage: str
    notes: Optional[str] = None
    win_probability: Optional[int] = Field(None, ge=0, le=100)


class DealStageHistoryResponse(BaseModel):
    id: str
    deal_id: str
    from_stage: Optional[str] = None
    to_stage: str
    notes: Optional[str] = None
    changed_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DealResponse(DealBase):
    id: str
    company_name: Optional[str] = None
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    service_name: Optional[str] = None
    owner_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Activities ---
class ActivityBase(BaseModel):
    entity_type: str = Field(..., max_length=50)  # lead, deal, company, contact
    entity_id: str
    activity_type: str = Field(..., max_length=50)  # call, email, meeting, note, follow_up, task
    subject: str = Field(..., min_length=1, max_length=255)
    notes: str
    status: str = Field("completed", max_length=50)  # pending, completed, cancelled
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    subject: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ActivityResponse(ActivityBase):
    id: str
    created_by_user_id: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DealDetailResponse(DealResponse):
    stage_history: List[DealStageHistoryResponse] = []
    activities: List[ActivityResponse] = []


# --- CRM Dashboard Analytics ---
class SalespersonPerformance(BaseModel):
    user_id: str
    full_name: str
    deals_count: int
    won_deals_count: int
    won_revenue: Decimal
    pipeline_value: Decimal
    win_rate: float


class CRMDashboardMetrics(BaseModel):
    new_leads: int
    qualified_leads: int
    open_deals: int
    pipeline_value: Decimal
    won_revenue: Decimal
    lost_deals: int
    conversion_rate: float
    average_deal_value: Decimal
    salesperson_performance: List[SalespersonPerformance] = []
    stage_distribution: Dict[str, int] = {}

class FollowUpReminderCreate(BaseModel):
    entity_type: str = Field(..., max_length=50) # lead, contact, deal
    entity_id: str
    message: str
    due_date: datetime

class FollowUpReminderResponse(FollowUpReminderCreate):
    id: str
    status: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
