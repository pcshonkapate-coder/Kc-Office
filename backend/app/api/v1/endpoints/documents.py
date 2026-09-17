from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.models.document import ManagedDocument, DocumentVersion, SignatureTracker
from app.schemas.document import (
    ManagedDocumentCreate, ManagedDocumentResponse, 
    DocumentVersionCreate, DocumentVersionResponse,
    SignatureTrackerResponse
)
from app.services.document_service import DocumentService
from app.services.signature.mock_adapter import MockSignatureAdapter
from app.services.pdf.generator import PDFGenerator
from app.core.logging import logger
from fastapi.responses import Response

router = APIRouter()

# Instantiate services (in a real app, these might be injected)
pdf_generator = PDFGenerator()
signature_adapter = MockSignatureAdapter()

def get_document_service(db: Session = Depends(get_db)):
    return DocumentService(db=db, signature_provider=signature_adapter)

@router.post("/", response_model=ManagedDocumentResponse, status_code=status.HTTP_201_CREATED)
def create_managed_document(
    data: ManagedDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service)
):
    """Create a new managed document (Proposal, SOW, NDA) with its initial version."""
    return service.create_document(data=data, owner_id=current_user.id)

@router.get("/{document_id}", response_model=ManagedDocumentResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve a document with all its versions and signature tracking."""
    doc = db.query(ManagedDocument).filter(ManagedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check permissions based on user role / contact_id
    if current_user.role == "client" and doc.contact_id != current_user.id:
        # Assuming we might map client user ID to contact ID, simplified for now
        raise HTTPException(status_code=403, detail="Not authorized to view this document")
        
    return doc

@router.post("/{document_id}/versions", response_model=DocumentVersionResponse)
def add_document_version(
    document_id: str,
    data: DocumentVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service)
):
    """Add a new version to the document."""
    return service.add_new_version(document_id, data, current_user.id)

class SignatureRequest(BaseModel):
    signers: List[dict] # e.g. [{"name": "John", "email": "john@ex.com"}]

@router.post("/{document_id}/signature", response_model=SignatureTrackerResponse)
def initiate_signature(
    document_id: str,
    payload: SignatureRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service)
):
    """Generates PDF and sends the document for signature."""
    doc = db.query(ManagedDocument).filter(ManagedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    latest_version = db.query(DocumentVersion)\
        .filter(DocumentVersion.document_id == document_id)\
        .order_by(DocumentVersion.version_number.desc())\
        .first()

    if not latest_version:
        raise HTTPException(status_code=400, detail="Document has no content versions")

    # Generate PDF
    data_for_pdf = {
        "title": doc.title,
        "sections": latest_version.sections
    }
    pdf_bytes = pdf_generator.generate_pdf(doc.document_type, data_for_pdf)

    # Initiate signature
    tracker = service.initiate_signature(document_id, payload.signers, pdf_bytes)
    return tracker

@router.get("/{document_id}/pdf")
def download_pdf(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Downloads the latest version of the document as a PDF."""
    doc = db.query(ManagedDocument).filter(ManagedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    latest_version = db.query(DocumentVersion)\
        .filter(DocumentVersion.document_id == document_id)\
        .order_by(DocumentVersion.version_number.desc())\
        .first()

    data_for_pdf = {
        "title": doc.title,
        "sections": latest_version.sections if latest_version else {}
    }
    pdf_bytes = pdf_generator.generate_pdf(doc.document_type, data_for_pdf)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{doc.title}.pdf"'}
    )
