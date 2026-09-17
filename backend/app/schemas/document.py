from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field


# --- Document Version Schemas ---

class DocumentVersionBase(BaseModel):
    sections: Dict[str, Any] = Field(..., description="Structured JSON representation of document sections")


class DocumentVersionCreate(DocumentVersionBase):
    pass


class DocumentVersionResponse(DocumentVersionBase):
    id: str
    document_id: str
    version_number: int
    is_locked: bool
    created_by_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Signature Tracker Schemas ---

class SignatureTrackerResponse(BaseModel):
    id: str
    provider: str
    external_envelope_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Managed Document Schemas ---

class ManagedDocumentBase(BaseModel):
    document_type: str = Field(..., description="proposal, nda, msa, sow, contract, invoice, technical, other")
    title: str = Field(..., max_length=255)
    company_id: Optional[str] = None
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None
    service_id: Optional[str] = None
    project_id: Optional[str] = None


class ManagedDocumentCreate(ManagedDocumentBase):
    initial_sections: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Initial structure of the document's content/sections"
    )


class ManagedDocumentUpdate(BaseModel):
    title: Optional[str] = None
    current_status: Optional[str] = None


class ManagedDocumentResponse(ManagedDocumentBase):
    id: str
    current_status: str
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional nested data (can be included in detailed endpoints)
    versions: Optional[List[DocumentVersionResponse]] = None
    signatures: Optional[List[SignatureTrackerResponse]] = None

    class Config:
        from_attributes = True
