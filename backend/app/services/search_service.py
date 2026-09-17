from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.crm import Company, Contact, Lead, Deal
from app.models.delivery import Project, Task
from app.models.workforce import Employee, Intern
from app.models.finance import Invoice
from app.models.document import ManagedDocument
from app.models.system import Document

class GlobalSearchService:
    def __init__(self, db: Session):
        self.db = db

    def search(self, query_str: str, limit_per_entity: int = 5, user_permissions: Optional[List[str]] = None) -> Dict[str, List[Dict[str, Any]]]:
        if not query_str or len(query_str.strip()) < 2:
            return {}

        term = f"%{query_str.strip()}%"
        results: Dict[str, List[Dict[str, Any]]] = {}

        # 1. Companies
        companies = (
            self.db.query(Company)
            .filter(or_(Company.name.ilike(term), Company.domain.ilike(term), Company.industry.ilike(term)))
            .limit(limit_per_entity)
            .all()
        )
        if companies:
            results["companies"] = [{"id": c.id, "title": c.name, "subtitle": c.industry or c.domain, "type": "Company"} for c in companies]

        # 2. Contacts
        contacts = (
            self.db.query(Contact)
            .filter(or_(Contact.name.ilike(term), Contact.email.ilike(term)))
            .limit(limit_per_entity)
            .all()
        )
        if contacts:
            results["contacts"] = [{"id": c.id, "title": c.name, "subtitle": c.email, "type": "Contact"} for c in contacts]

        # 3. Leads
        leads = (
            self.db.query(Lead)
            .filter(or_(Lead.name.ilike(term), Lead.company_name.ilike(term), Lead.contact_name.ilike(term)))
            .limit(limit_per_entity)
            .all()
        )
        if leads:
            results["leads"] = [{"id": l.id, "title": l.name, "subtitle": l.company_name, "type": "Lead"} for l in leads]

        # 4. Deals
        deals = (
            self.db.query(Deal)
            .filter(Deal.title.ilike(term))
            .limit(limit_per_entity)
            .all()
        )
        if deals:
            results["deals"] = [{"id": d.id, "title": d.title, "subtitle": f"Stage: {d.pipeline_stage}", "type": "Deal"} for d in deals]

        # 5. Projects
        projects = (
            self.db.query(Project)
            .filter(or_(Project.name.ilike(term), Project.project_code.ilike(term)))
            .limit(limit_per_entity)
            .all()
        )
        if projects:
            results["projects"] = [{"id": p.id, "title": p.name, "subtitle": p.project_code, "type": "Project"} for p in projects]

        # 6. Tasks
        tasks = (
            self.db.query(Task)
            .filter(Task.title.ilike(term))
            .limit(limit_per_entity)
            .all()
        )
        if tasks:
            results["tasks"] = [{"id": t.id, "title": t.title, "subtitle": f"Priority: {t.priority}", "type": "Task"} for t in tasks]

        # 7. Employees
        employees = (
            self.db.query(Employee)
            .filter(or_(Employee.name.ilike(term), Employee.email.ilike(term)))
            .limit(limit_per_entity)
            .all()
        )
        if employees:
            results["employees"] = [{"id": e.id, "title": e.name, "subtitle": e.email, "type": "Employee"} for e in employees]

        # 8. Interns
        interns = (
            self.db.query(Intern)
            .filter(or_(Intern.name.ilike(term), Intern.email.ilike(term)))
            .limit(limit_per_entity)
            .all()
        )
        if interns:
            results["interns"] = [{"id": i.id, "title": i.name, "subtitle": i.email, "type": "Intern"} for i in interns]

        # 9. Invoices
        invoices = (
            self.db.query(Invoice)
            .filter(Invoice.invoice_number.ilike(term))
            .limit(limit_per_entity)
            .all()
        )
        if invoices:
            results["invoices"] = [{"id": inv.id, "title": inv.invoice_number, "subtitle": f"Status: {inv.status}", "type": "Invoice"} for inv in invoices]

        # 10. Documents
        managed_docs = (
            self.db.query(ManagedDocument)
            .filter(ManagedDocument.title.ilike(term))
            .limit(limit_per_entity)
            .all()
        )
        sys_docs = (
            self.db.query(Document)
            .filter(Document.file_name.ilike(term))
            .limit(limit_per_entity)
            .all()
        )
        docs_list = [{"id": d.id, "title": d.title, "subtitle": d.document_type, "type": "Document"} for d in managed_docs]
        docs_list.extend([{"id": d.id, "title": d.file_name, "subtitle": d.entity_type, "type": "Document"} for d in sys_docs])

        if docs_list:
            results["documents"] = docs_list[:limit_per_entity]

        return results
