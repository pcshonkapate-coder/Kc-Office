from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.document import ManagedDocument, DocumentVersion, SignatureTracker
from app.schemas.document import ManagedDocumentCreate, DocumentVersionCreate
from app.core.exceptions import KapateAppException
from app.core.logging import logger
from .signature.base import SignatureProvider

class DocumentService:
    def __init__(self, db: Session, signature_provider: Optional[SignatureProvider] = None):
        self.db = db
        self.signature_provider = signature_provider

    def create_document(self, data: ManagedDocumentCreate, owner_id: str) -> ManagedDocument:
        doc = ManagedDocument(
            document_type=data.document_type,
            title=data.title,
            company_id=data.company_id,
            contact_id=data.contact_id,
            deal_id=data.deal_id,
            service_id=data.service_id,
            project_id=data.project_id,
            owner_id=owner_id,
            current_status="Draft"
        )
        self.db.add(doc)
        self.db.flush()

        # Create initial version 1
        version = DocumentVersion(
            document_id=doc.id,
            version_number=1,
            sections=data.initial_sections,
            is_locked=False,
            created_by_id=owner_id
        )
        self.db.add(version)
        self.db.commit()
        self.db.refresh(doc)
        
        logger.info(f"Created new {data.document_type} Document #{doc.id} with V1")
        return doc

    def add_new_version(self, document_id: str, data: DocumentVersionCreate, user_id: str) -> DocumentVersion:
        """
        Adds a new version to the document, ensuring we don't overwrite locked versions.
        """
        doc = self.db.query(ManagedDocument).filter(ManagedDocument.id == document_id).first()
        if not doc:
            raise KapateAppException(status_code=404, detail="Document not found")
        
        latest_version = self.db.query(DocumentVersion)\
            .filter(DocumentVersion.document_id == document_id)\
            .order_by(DocumentVersion.version_number.desc())\
            .first()

        new_version_num = latest_version.version_number + 1 if latest_version else 1
        
        # If latest isn't locked, we could theoretically update it, but the instruction is to maintain versioning strictly.
        # We'll just create a new one to be safe, or lock the previous.
        if latest_version and not latest_version.is_locked:
            latest_version.is_locked = True
            self.db.add(latest_version)

        new_ver = DocumentVersion(
            document_id=document_id,
            version_number=new_version_num,
            sections=data.sections,
            is_locked=False,
            created_by_id=user_id
        )
        self.db.add(new_ver)
        self.db.commit()
        self.db.refresh(new_ver)
        return new_ver

    def initiate_signature(self, document_id: str, signers: List[Dict[str, str]], file_bytes: bytes) -> SignatureTracker:
        if not self.signature_provider:
            raise KapateAppException(status_code=500, detail="Signature provider not configured")

        doc = self.db.query(ManagedDocument).filter(ManagedDocument.id == document_id).first()
        if not doc:
            raise KapateAppException(status_code=404, detail="Document not found")

        # Create envelope via provider
        envelope_id = self.signature_provider.create_envelope(
            document_id=doc.id,
            file_bytes=file_bytes,
            signers=signers
        )

        tracker = SignatureTracker(
            document_id=doc.id,
            provider=self.signature_provider.provider_name,
            external_envelope_id=envelope_id,
            status="sent"
        )
        self.db.add(tracker)
        
        doc.current_status = "Sent"
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(tracker)
        return tracker
