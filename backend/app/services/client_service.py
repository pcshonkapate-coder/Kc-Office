from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.auth import User
from app.models.crm import Contact, Company
from app.models.delivery import Project, Milestone, Task
from app.models.finance import Invoice, Payment
from app.models.system import Document
from app.schemas.client import (
    ClientDashboardResponse, ClientProjectResponse, ClientMilestoneResponse,
    ClientTaskResponse, ClientInvoiceResponse, ClientInvoiceItemResponse,
    ClientPaymentResponse, ClientDocumentResponse
)
from app.core.exceptions import KapateAppException

class ClientService:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        
        # Authenticate Client to Company
        contact = self.db.query(Contact).filter(Contact.user_id == user.id).first()
        if not contact:
            # Fallback to email mapping if user_id wasn't set yet
            contact = self.db.query(Contact).filter(Contact.email == user.email).first()
            if not contact:
                raise KapateAppException(status_code=403, detail="Client Contact mapping not found.")
                
        self.company_id = contact.company_id
        self.company = self.db.query(Company).filter(Company.id == self.company_id).first()

    def get_dashboard(self) -> ClientDashboardResponse:
        projects_count = self.db.query(Project).filter(
            Project.company_id == self.company_id,
            Project.status != "COMPLETED",
            Project.status != "CANCELLED"
        ).count()
        
        invoices_count = self.db.query(Invoice).filter(
            Invoice.company_id == self.company_id,
            Invoice.status.in_(["SENT", "PARTIALLY PAID", "OVERDUE"])
        ).count()
        
        # Get documents linked to this company's projects that are client-safe
        allowed_types = ["proposal", "nda", "sow", "contract", "invoice", "deliverable"]
        docs = self.db.query(Document).join(
            Project, Document.entity_id == Project.id
        ).filter(
            Project.company_id == self.company_id,
            Document.entity_type.in_(allowed_types)
        ).order_by(Document.created_at.desc()).limit(5).all()

        return ClientDashboardResponse(
            company_name=self.company.name,
            active_projects_count=projects_count,
            pending_invoices_count=invoices_count,
            recent_documents=[ClientDocumentResponse.model_validate(d) for d in docs]
        )

    def get_projects(self) -> List[ClientProjectResponse]:
        projects = self.db.query(Project).filter(Project.company_id == self.company_id).all()
        result = []
        for p in projects:
            p_resp = ClientProjectResponse.model_validate(p)
            
            # Filter milestones based on client_visible
            p_resp.milestones = []
            for m in p.milestones:
                if getattr(m, 'client_visible', False):
                    m_resp = ClientMilestoneResponse.model_validate(m)
                    # Filter tasks based on client_visible
                    m_resp.tasks = [ClientTaskResponse.model_validate(t) for t in m.tasks if getattr(t, 'client_visible', False)]
                    p_resp.milestones.append(m_resp)
            result.append(p_resp)
            
        return result

    def get_invoices(self) -> List[ClientInvoiceResponse]:
        invoices = self.db.query(Invoice).filter(
            Invoice.company_id == self.company_id,
            Invoice.status != "DRAFT" # Clients don't see drafts
        ).all()
        return [ClientInvoiceResponse.model_validate(i) for i in invoices]
