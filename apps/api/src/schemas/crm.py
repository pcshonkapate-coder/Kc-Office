from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Contact Schemas
class ContactCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=128)
    last_name: str = Field(..., min_length=1, max_length=128)
    email: EmailStr
    phone: Optional[str] = None
    designation: Optional[str] = None
    is_primary: bool = False


class ContactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    designation: Optional[str] = None
    is_primary: bool


# Account (Client 360) Schemas
class AccountCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    industry: str = Field("Technology", max_length=128)
    website: Optional[str] = None
    tier: str = Field("GROWTH", examples=["ENTERPRISE", "GROWTH", "STARTUP"])
    status: str = Field("ACTIVE", examples=["PROSPECT", "ACTIVE", "CHURNED"])


class AccountRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    industry: str
    website: Optional[str] = None
    tier: str
    status: str
    total_revenue: Decimal
    created_at: datetime
    contacts: List[ContactRead] = []


class Account360Detail(AccountRead):
    total_deals: int = 0
    active_contracts_count: int = 0
    pipeline_value: Decimal = Decimal("0.00")


# Lead Schemas
class LeadCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    contact_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    company: str = Field(..., min_length=2, max_length=255)
    source: str = Field("WEBSITE", examples=["WEBSITE", "REFERRAL", "OUTREACH", "PARTNER"])
    estimated_value: Decimal = Decimal("0.00")


class LeadConvertRequest(BaseModel):
    tier: str = Field("GROWTH", examples=["ENTERPRISE", "GROWTH", "STARTUP"])
    deal_name: Optional[str] = None
    contract_amount: Optional[Decimal] = None


class LeadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    company: str
    source: str
    status: str
    estimated_value: Decimal
    created_at: datetime


# Opportunity (Deal) Schemas
class OpportunityCreate(BaseModel):
    account_id: uuid.UUID
    name: str = Field(..., min_length=3, max_length=255)
    stage: str = Field("DISCOVERY", examples=["DISCOVERY", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"])
    contract_amount: Decimal = Decimal("0.00")
    win_probability: int = Field(20, ge=0, le=100)
    expected_close_date: date


class OpportunityStageUpdate(BaseModel):
    stage: str = Field(..., examples=["DISCOVERY", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"])
    win_probability: Optional[int] = Field(None, ge=0, le=100)


class OpportunityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    account_id: uuid.UUID
    name: str
    stage: str
    contract_amount: Decimal
    win_probability: int
    expected_close_date: date
    created_at: datetime
    account_name: Optional[str] = None


# Proposal Schemas
class ProposalCreate(BaseModel):
    opportunity_id: uuid.UUID
    proposal_number: str = Field(..., min_length=3, max_length=64)
    title: str = Field(..., min_length=3, max_length=255)
    total_amount: Decimal
    valid_until: date
    scope_of_work: Dict[str, Any] = Field(default_factory=dict)


class ProposalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    opportunity_id: uuid.UUID
    proposal_number: str
    title: str
    status: str
    total_amount: Decimal
    valid_until: date
    scope_of_work: Dict[str, Any]
    sent_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    created_at: datetime


# Contract Schemas
class ContractCreate(BaseModel):
    account_id: uuid.UUID
    proposal_id: Optional[uuid.UUID] = None
    contract_number: str = Field(..., min_length=3, max_length=64)
    title: str = Field(..., min_length=3, max_length=255)
    total_value: Decimal
    start_date: date
    end_date: date


class ContractSignRequest(BaseModel):
    signer_name: str = Field(..., min_length=2, max_length=255)


class ContractRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    account_id: uuid.UUID
    proposal_id: Optional[uuid.UUID] = None
    contract_number: str
    title: str
    status: str
    total_value: Decimal
    start_date: date
    end_date: date
    signed_at: Optional[datetime] = None
    signer_name: Optional[str] = None
    digital_hash: Optional[str] = None
    created_at: datetime
    account_name: Optional[str] = None
