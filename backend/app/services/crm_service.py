from typing import Optional, Dict, Any, Tuple
from datetime import datetime, date, timezone, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.repositories.crm_repository import CRMRepository
from app.models.crm import (
    Company, Contact, Lead, Deal, DealStageHistory, Activity, Contract, Service
)
from app.models.delivery import Project
from app.schemas.crm import LeadConvertRequest, PublicLeadCreate
from app.core.exceptions import KapateAppException
from app.core.logging import logger
from app.core.sanitization import sanitize_text, validate_honeypot


class CRMService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CRMRepository(db)

    def process_public_lead_submission(
        self,
        payload: PublicLeadCreate,
        client_ip: Optional[str] = None,
    ) -> Tuple[Lead, bool]:
        """
        Processes inbound consultation submissions from the public website:
        1. Honeypot check for spam prevention
        2. Input sanitization (XSS and malicious markup stripping)
        3. Intelligent duplicate detection: updates existing lead and appends activity timeline
        4. Automatic actions: generates sequential lead code, sets status='NEW LEAD',
           logs inbound activity, emits sales notification, and records prospect confirmation.
        Returns: (Lead, is_duplicate)
        """
        # 1. Honeypot check
        if not validate_honeypot(payload.hp_website_company_fax):
            logger.warning(f"Spam bot submission blocked from IP: {client_ip}")
            raise KapateAppException(status_code=400, detail="Automated spam request rejected.")

        # 2. Input sanitization
        clean_name = sanitize_text(payload.name) or "Prospective Client"
        clean_email = payload.email.strip().lower()
        clean_phone = sanitize_text(payload.phone)
        clean_company = sanitize_text(payload.company) or f"{clean_name}'s Enterprise"
        clean_service = sanitize_text(payload.service)
        clean_budget = sanitize_text(payload.budget)
        clean_message = sanitize_text(payload.message) or ""

        # Resolve service ID if matching name exists
        service_id = None
        if clean_service:
            matched_service = (
                self.db.query(Service)
                .filter(
                    Service.name.ilike(f"%{clean_service}%"),
                    Service.is_active.is_(True),
                )
                .first()
            )
            if matched_service:
                service_id = matched_service.id

        # 3. Duplicate Detection
        existing_lead = (
            self.db.query(Lead)
            .filter(
                Lead.email == clean_email,
            )
            .order_by(Lead.created_at.desc())
            .first()
        )

        now = datetime.now(timezone.utc)

        if existing_lead:
            # Update existing lead with latest contact & interest coordinates
            if clean_phone and not existing_lead.phone:
                existing_lead.phone = clean_phone
            if clean_budget:
                existing_lead.budget = clean_budget
                existing_lead.budget_range = clean_budget
            if clean_service:
                existing_lead.service_interest = clean_service
                if service_id:
                    existing_lead.service_id = service_id
            
            existing_lead.last_contacted_at = now
            if existing_lead.status in ["disqualified", "closed", "converted"]:
                # Re-activate attention on existing lead if they inquire again
                existing_lead.status = "QUALIFICATION"

            # Append inquiry activity
            inquiry_activity = Activity(
                entity_type="lead",
                entity_id=existing_lead.id,
                activity_type="note",
                subject="Additional Website Inquiry Received",
                notes=(
                    f"Prospect submitted a follow-up inquiry via website contact form.\n"
                    f"IP: {client_ip or 'unknown'}\n"
                    f"Service Interest: {clean_service or 'N/A'}\n"
                    f"Budget: {clean_budget or 'N/A'}\n"
                    f"Message/Brief:\n{clean_message}"
                ),
                status="completed",
                completed_at=now,
            )
            self.db.add(inquiry_activity)

            # Record automated confirmation dispatch
            confirm_activity = Activity(
                entity_type="lead",
                entity_id=existing_lead.id,
                activity_type="email",
                subject="Consultation Request Acknowledged",
                notes=f"Automated email confirmation sent to {clean_email} referencing Lead #{existing_lead.lead_code}.",
                status="completed",
                completed_at=now,
            )
            self.db.add(confirm_activity)

            self.db.commit()
            self.db.refresh(existing_lead)

            logger.info(
                f"[CRM Duplicate Ingestion] Appended repeat inquiry to Lead #{existing_lead.lead_code} ({clean_email})"
            )
            return existing_lead, True

        # 4. New Lead Ingestion
        # Determine priority based on budget
        priority = "medium"
        if clean_budget:
            b_lower = clean_budget.lower()
            if any(k in b_lower for k in ["50k", "100k", "1cr", "50l", "enterprise", "$100k+"]):
                priority = "high"
            elif "under $25k" in b_lower:
                priority = "low"

        lead = Lead(
            name=clean_name,
            contact_name=clean_name,
            company_name=clean_company,
            email=clean_email,
            phone=clean_phone,
            country="India",
            service_id=service_id,
            service_interest=clean_service,
            budget=clean_budget,
            budget_range=clean_budget,
            currency="INR" if "₹" in (clean_budget or "") else "USD",
            project_description=clean_message,
            brief=clean_message,
            source="Website contact form",
            priority=priority,
            lead_score=75,
            status="NEW LEAD",
            last_contacted_at=now,
        )
        created_lead = self.repo.create_lead(lead)

        # Initial Inbound Activity
        initial_activity = Activity(
            entity_type="lead",
            entity_id=created_lead.id,
            activity_type="note",
            subject="Website Consultation Request",
            notes=(
                f"Initial consultation request received via website contact form.\n"
                f"IP: {client_ip or 'unknown'}\n"
                f"Service Interest: {clean_service or 'N/A'}\n"
                f"Budget: {clean_budget or 'N/A'}\n"
                f"Brief:\n{clean_message}"
            ),
            status="completed",
            completed_at=now,
        )
        self.db.add(initial_activity)

        # Confirmation Dispatch Activity
        confirm_activity = Activity(
            entity_type="lead",
            entity_id=created_lead.id,
            activity_type="email",
            subject="Consultation Request Acknowledged",
            notes=f"Automated session confirmation sent to {clean_email} referencing Lead #{created_lead.lead_code}.",
            status="completed",
            completed_at=now,
        )
        self.db.add(confirm_activity)

        self.db.commit()
        self.db.refresh(created_lead)

        logger.info(
            f"[CRM New Ingestion] Created Lead #{created_lead.lead_code} - {created_lead.name} ({clean_email}) from Website"
        )
        return created_lead, False

    def convert_lead_to_deal(
        self,
        lead_id: str,
        convert_data: LeadConvertRequest,
        current_user_id: Optional[str] = None,
    ) -> Tuple[Company, Contact, Deal]:
        """
        Converts an inbound/qualified lead into a formal Company, primary Contact,
        and active Deal in the sales pipeline.
        """
        lead = self.repo.get_lead_by_id(lead_id)
        if not lead:
            raise KapateAppException(status_code=404, detail="Lead not found.")

        if lead.status == "converted" and lead.converted_deal_id:
            existing_deal = self.repo.get_deal_by_id(lead.converted_deal_id)
            if existing_deal:
                raise KapateAppException(
                    status_code=400,
                    detail=f"Lead has already been converted to deal '{existing_deal.title}'.",
                )

        # 1. Resolve or create Company
        company = (
            self.db.query(Company)
            .filter(
                Company.name.ilike(lead.company_name.strip()),
                Company.is_deleted.is_(False),
            )
            .first()
        )
        if not company:
            company = Company(
                name=lead.company_name.strip(),
                city=lead.city,
                country=lead.country or "India",
                source=lead.source,
                notes=f"Converted from Lead #{lead.lead_code}: {lead.notes or ''}".strip(),
            )
            self.db.add(company)
            self.db.flush()
            logger.info(f"Created company '{company.name}' from lead #{lead.lead_code}")

        # 2. Resolve or create Contact
        contact = (
            self.db.query(Contact)
            .filter(
                Contact.company_id == company.id,
                Contact.email == lead.email.strip().lower(),
                Contact.is_deleted.is_(False),
            )
            .first()
        )
        if not contact:
            contact = Contact(
                company_id=company.id,
                name=lead.name,
                email=lead.email.strip().lower(),
                phone=lead.phone,
                job_title=lead.job_title,
                designation=lead.job_title,
                role_in_buying_process="Decision Maker",
                is_primary=True,
                notes="Created via lead conversion",
            )
            self.db.add(contact)
            self.db.flush()
            logger.info(f"Created contact '{contact.name}' for company '{company.name}'")

        # 3. Parse budget if estimated_value is not supplied
        deal_value = convert_data.estimated_value or Decimal("0.00")
        if deal_value == Decimal("0.00") and lead.budget:
            try:
                # Try simple numeric extraction if format like '50000'
                cleaned = "".join(c for c in lead.budget if c.isdigit() or c == ".")
                if cleaned:
                    deal_value = Decimal(cleaned)
            except Exception:
                pass

        deal_title = (
            convert_data.deal_title
            or f"{company.name} - {lead.service_interest or 'Consultancy Engagement'}"
        )

        # 4. Create Deal
        deal = Deal(
            title=deal_title,
            company_id=company.id,
            primary_contact_id=contact.id,
            lead_id=lead.id,
            service_id=lead.service_id,
            estimated_value=deal_value,
            currency=convert_data.currency or lead.currency or "INR",
            expected_close_date=convert_data.expected_close_date or (date.today() + timedelta(days=30)),
            pipeline_stage=convert_data.pipeline_stage or "QUALIFICATION",
            win_probability=20 if convert_data.pipeline_stage == "QUALIFICATION" else 50,
            owner_user_id=convert_data.assigned_owner_id or lead.assigned_salesperson_id or current_user_id,
            notes=f"Project description: {lead.project_description or ''}\n\nLead Notes: {lead.notes or ''}".strip(),
        )
        self.db.add(deal)
        self.db.flush()

        # 5. Record initial stage history
        history = DealStageHistory(
            deal_id=deal.id,
            from_stage=None,
            to_stage=deal.pipeline_stage,
            notes=f"Converted from inbound Lead #{lead.lead_code}",
            changed_by_user_id=current_user_id,
        )
        self.db.add(history)

        # 6. Update Lead state
        lead.status = "converted"
        lead.converted_deal_id = deal.id
        lead.last_contacted_at = datetime.now(timezone.utc)

        # 7. Log Activity
        activity = Activity(
            entity_type="deal",
            entity_id=deal.id,
            activity_type="note",
            subject="Lead Converted to Deal",
            notes=f"Lead #{lead.lead_code} ({lead.name}) converted into active deal '{deal.title}'.",
            status="completed",
            completed_at=datetime.now(timezone.utc),
            created_by_user_id=current_user_id,
        )
        self.db.add(activity)

        self.db.commit()
        self.db.refresh(company)
        self.db.refresh(contact)
        self.db.refresh(deal)

        logger.info(
            f"Successfully converted lead '{lead.lead_code}' to Deal '{deal.id}' (Company: '{company.name}')"
        )
        return company, contact, deal

    def convert_won_deal_to_project(
        self,
        deal_id: str,
        current_user_id: Optional[str] = None,
        project_name: Optional[str] = None,
    ) -> Tuple[Contract, Project]:
        """
        Connects CRM to delivery operations: converts a CLOSED WON deal into
        an executed/draft Contract and active Project in Kapate OS.
        """
        deal = self.repo.get_deal_by_id(deal_id)
        if not deal:
            raise KapateAppException(status_code=404, detail="Deal not found.")

        today = date.today()

        # 1. Create SOW / MSA Contract
        contract = Contract(
            deal_id=deal.id,
            company_id=deal.company_id,
            contract_type="sow",
            status="signed" if deal.pipeline_stage == "CLOSED WON" else "draft",
            signed_at=datetime.now(timezone.utc) if deal.pipeline_stage == "CLOSED WON" else None,
        )
        self.db.add(contract)
        self.db.flush()

        # 2. Generate unique project code
        project_count = self.db.query(Project).count() + 1
        code = f"PRJ-{today.year}-{100 + project_count}"

        # 3. Create Project
        project = Project(
            company_id=deal.company_id,
            contract_id=contract.id,
            project_code=code,
            name=project_name or deal.title,
            description=deal.notes or f"Initiated from won deal #{deal.id}",
            project_type="fixed_bid",
            status="active",
            budget=deal.estimated_value,
            currency=deal.currency,
            start_date=today,
            end_date=today + timedelta(days=90),
            project_manager_id=deal.owner_user_id or current_user_id,
        )
        self.db.add(project)
        self.db.flush()

        # Log activity
        act = Activity(
            entity_type="deal",
            entity_id=deal.id,
            activity_type="note",
            subject="Project & Contract Initiated",
            notes=f"Created Project '{project.name}' ({project.project_code}) and Contract #{contract.id} from Won Deal.",
            status="completed",
            completed_at=datetime.now(timezone.utc),
            created_by_user_id=current_user_id,
        )
        self.db.add(act)

        self.db.commit()
        self.db.refresh(contract)
        self.db.refresh(project)

        logger.info(
            f"Successfully bridged Deal '{deal.id}' to Project '{project.project_code}' and Contract '{contract.id}'"
        )
        return contract, project
