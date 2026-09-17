from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timezone
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from app.models.crm import (
    Service, Company, Contact, Lead, Deal, DealStageHistory, DealContact, Activity
)
from app.models.auth import User


class CRMRepository:
    def __init__(self, db: Session):
        self.db = db

    # ==================== SERVICES ====================
    def get_services(self, active_only: bool = False) -> List[Service]:
        query = self.db.query(Service)
        if active_only:
            query = query.filter(Service.is_active.is_(True))
        return query.order_by(Service.category, Service.name).all()

    def get_service_by_id(self, service_id: str) -> Optional[Service]:
        return self.db.query(Service).filter(Service.id == service_id).first()

    def get_service_by_code(self, code: str) -> Optional[Service]:
        return self.db.query(Service).filter(Service.code == code).first()

    def create_service(self, service: Service) -> Service:
        self.db.add(service)
        self.db.commit()
        self.db.refresh(service)
        return service

    def update_service(self, service: Service, data: dict) -> Service:
        for key, value in data.items():
            if value is not None:
                setattr(service, key, value)
        self.db.commit()
        self.db.refresh(service)
        return service

    def delete_service(self, service: Service) -> None:
        self.db.delete(service)
        self.db.commit()

    # ==================== COMPANIES ====================
    def get_companies(
        self,
        search: Optional[str] = None,
        industry: Optional[str] = None,
        country: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Company]:
        query = self.db.query(Company).filter(Company.is_deleted.is_(False))
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(Company.name).like(s),
                    func.lower(Company.city).like(s),
                    func.lower(Company.industry).like(s),
                )
            )
        if industry:
            query = query.filter(Company.industry == industry)
        if country:
            query = query.filter(Company.country == country)

        return query.order_by(Company.name.asc()).offset(offset).limit(limit).all()

    def get_company_by_id(self, company_id: str) -> Optional[Company]:
        return (
            self.db.query(Company)
            .filter(Company.id == company_id, Company.is_deleted.is_(False))
            .first()
        )

    def create_company(self, company: Company) -> Company:
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)
        return company

    def update_company(self, company: Company, data: dict) -> Company:
        for key, value in data.items():
            if value is not None:
                setattr(company, key, value)
        self.db.commit()
        self.db.refresh(company)
        return company

    def delete_company(self, company: Company) -> None:
        company.is_deleted = True
        company.deleted_at = datetime.now(timezone.utc)
        self.db.commit()

    # ==================== CONTACTS ====================
    def get_contacts(
        self,
        company_id: Optional[str] = None,
        search: Optional[str] = None,
        role: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Contact]:
        query = self.db.query(Contact).filter(Contact.is_deleted.is_(False))
        if company_id:
            query = query.filter(Contact.company_id == company_id)
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(Contact.name).like(s),
                    func.lower(Contact.email).like(s),
                    func.lower(Contact.phone).like(s),
                )
            )
        if role:
            query = query.filter(Contact.role_in_buying_process == role)

        return query.order_by(Contact.name.asc()).offset(offset).limit(limit).all()

    def get_contact_by_id(self, contact_id: str) -> Optional[Contact]:
        return (
            self.db.query(Contact)
            .filter(Contact.id == contact_id, Contact.is_deleted.is_(False))
            .first()
        )

    def create_contact(self, contact: Contact) -> Contact:
        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def update_contact(self, contact: Contact, data: dict) -> Contact:
        for key, value in data.items():
            if value is not None:
                setattr(contact, key, value)
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def delete_contact(self, contact: Contact) -> None:
        contact.is_deleted = True
        contact.deleted_at = datetime.now(timezone.utc)
        self.db.commit()

    # ==================== LEADS ====================
    def get_leads(
        self,
        search: Optional[str] = None,
        source: Optional[str] = None,
        service_id: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        salesperson_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Lead]:
        query = (
            self.db.query(Lead)
            .options(joinedload(Lead.service), joinedload(Lead.assigned_salesperson))
        )
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(Lead.name).like(s),
                    func.lower(Lead.company_name).like(s),
                    func.lower(Lead.email).like(s),
                    func.lower(Lead.lead_code).like(s),
                )
            )
        if source:
            query = query.filter(Lead.source == source)
        if service_id:
            query = query.filter(Lead.service_id == service_id)
        if status:
            query = query.filter(Lead.status == status)
        if priority:
            query = query.filter(Lead.priority == priority)
        if salesperson_id:
            query = query.filter(Lead.assigned_salesperson_id == salesperson_id)

        return query.order_by(Lead.created_at.desc()).offset(offset).limit(limit).all()

    def get_lead_by_id(self, lead_id: str) -> Optional[Lead]:
        return (
            self.db.query(Lead)
            .options(joinedload(Lead.service), joinedload(Lead.assigned_salesperson))
            .filter(Lead.id == lead_id)
            .first()
        )

    def create_lead(self, lead: Lead) -> Lead:
        if not lead.lead_code:
            count = self.db.query(Lead).count() + 1
            lead.lead_code = f"LD-{1000 + count}"
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def update_lead(self, lead: Lead, data: dict) -> Lead:
        for key, value in data.items():
            if value is not None:
                setattr(lead, key, value)
                if key == "name" and not getattr(lead, "contact_name", None):
                    lead.contact_name = value
                if key == "project_description" and not getattr(lead, "brief", None):
                    lead.brief = value
                if key == "budget" and not getattr(lead, "budget_range", None):
                    lead.budget_range = value
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def delete_lead(self, lead: Lead) -> None:
        self.db.delete(lead)
        self.db.commit()

    # ==================== DEALS ====================
    def get_deals(
        self,
        search: Optional[str] = None,
        company_id: Optional[str] = None,
        contact_id: Optional[str] = None,
        service_id: Optional[str] = None,
        stage: Optional[str] = None,
        owner_id: Optional[str] = None,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Deal]:
        query = (
            self.db.query(Deal)
            .options(
                joinedload(Deal.company),
                joinedload(Deal.primary_contact),
                joinedload(Deal.service),
                joinedload(Deal.owner),
            )
            .filter(Deal.is_deleted.is_(False))
        )
        if search:
            s = f"%{search.lower()}%"
            query = query.join(Company, Deal.company_id == Company.id).filter(
                or_(
                    func.lower(Deal.title).like(s),
                    func.lower(Company.name).like(s),
                )
            )
        if company_id:
            query = query.filter(Deal.company_id == company_id)
        if contact_id:
            query = query.filter(Deal.primary_contact_id == contact_id)
        if service_id:
            query = query.filter(Deal.service_id == service_id)
        if stage:
            query = query.filter(Deal.pipeline_stage == stage)
        if owner_id:
            query = query.filter(Deal.owner_user_id == owner_id)
        if min_value is not None:
            query = query.filter(Deal.estimated_value >= min_value)
        if max_value is not None:
            query = query.filter(Deal.estimated_value <= max_value)
        if start_date:
            query = query.filter(Deal.expected_close_date >= start_date)
        if end_date:
            query = query.filter(Deal.expected_close_date <= end_date)

        return query.order_by(Deal.created_at.desc()).offset(offset).limit(limit).all()

    def get_deal_by_id(self, deal_id: str) -> Optional[Deal]:
        return (
            self.db.query(Deal)
            .options(
                joinedload(Deal.company),
                joinedload(Deal.primary_contact),
                joinedload(Deal.service),
                joinedload(Deal.owner),
                joinedload(Deal.stage_history),
            )
            .filter(Deal.id == deal_id, Deal.is_deleted.is_(False))
            .first()
        )

    def create_deal(self, deal: Deal) -> Deal:
        self.db.add(deal)
        self.db.commit()
        self.db.refresh(deal)

        # Record initial stage history
        initial_history = DealStageHistory(
            deal_id=deal.id,
            from_stage=None,
            to_stage=deal.pipeline_stage,
            notes="Deal created in pipeline",
            changed_by_user_id=deal.owner_user_id,
        )
        self.db.add(initial_history)
        self.db.commit()
        return deal

    def update_deal(self, deal: Deal, data: dict) -> Deal:
        old_stage = deal.pipeline_stage
        for key, value in data.items():
            if value is not None:
                setattr(deal, key, value)
        self.db.commit()
        self.db.refresh(deal)
        return deal

    def record_stage_change(
        self,
        deal: Deal,
        new_stage: str,
        notes: Optional[str] = None,
        win_probability: Optional[int] = None,
        user_id: Optional[str] = None,
    ) -> DealStageHistory:
        old_stage = deal.pipeline_stage
        deal.pipeline_stage = new_stage

        # Automatic probability updates based on standard stages if not overridden
        if win_probability is not None:
            deal.win_probability = win_probability
        else:
            default_probabilities = {
                "NEW LEAD": 10,
                "QUALIFICATION": 20,
                "DISCOVERY BOOKED": 30,
                "DISCOVERY COMPLETED": 40,
                "TECHNICAL ASSESSMENT": 50,
                "NDA / MSA": 60,
                "PROPOSAL / SOW": 75,
                "NEGOTIATION": 85,
                "CLOSED WON": 100,
                "CLOSED LOST": 0,
            }
            if new_stage in default_probabilities:
                deal.win_probability = default_probabilities[new_stage]

        history_entry = DealStageHistory(
            deal_id=deal.id,
            from_stage=old_stage,
            to_stage=new_stage,
            notes=notes or f"Stage transitioned from {old_stage} to {new_stage}",
            changed_by_user_id=user_id,
        )
        self.db.add(history_entry)
        self.db.commit()
        self.db.refresh(deal)
        self.db.refresh(history_entry)
        return history_entry

    def get_stage_history(self, deal_id: str) -> List[DealStageHistory]:
        return (
            self.db.query(DealStageHistory)
            .options(joinedload(DealStageHistory.changed_by))
            .filter(DealStageHistory.deal_id == deal_id)
            .order_by(DealStageHistory.created_at.desc())
            .all()
        )

    def delete_deal(self, deal: Deal) -> None:
        deal.is_deleted = True
        deal.deleted_at = datetime.now(timezone.utc)
        self.db.commit()

    # ==================== ACTIVITIES ====================
    def get_activities(
        self, entity_type: Optional[str] = None, entity_id: Optional[str] = None, limit: int = 100
    ) -> List[Activity]:
        query = self.db.query(Activity).options(joinedload(Activity.created_by))
        if entity_type:
            query = query.filter(Activity.entity_type == entity_type)
        if entity_id:
            query = query.filter(Activity.entity_id == entity_id)

        return query.order_by(Activity.created_at.desc()).limit(limit).all()

    def create_activity(self, activity: Activity) -> Activity:
        self.db.add(activity)
        self.db.commit()
        self.db.refresh(activity)
        return activity

    def update_activity(self, activity: Activity, data: dict) -> Activity:
        for key, value in data.items():
            if value is not None:
                setattr(activity, key, value)
        self.db.commit()
        self.db.refresh(activity)
        return activity

    def delete_activity(self, activity: Activity) -> None:
        self.db.delete(activity)
        self.db.commit()

    # ==================== DASHBOARD METRICS QUERY ENGINE ====================
    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """
        Executes real SQL aggregation queries for all CRM Key Performance Indicators.
        """
        # 1. Lead counts
        new_leads = (
            self.db.query(func.count(Lead.id))
            .filter(or_(Lead.status == "NEW LEAD", Lead.status == "new"))
            .scalar()
            or 0
        )
        qualified_leads = (
            self.db.query(func.count(Lead.id))
            .filter(
                Lead.status.in_(
                    ["QUALIFICATION", "DISCOVERY BOOKED", "DISCOVERY COMPLETED", "qualified"]
                )
            )
            .scalar()
            or 0
        )

        # 2. Deal counts and values
        open_deals_query = self.db.query(Deal).filter(
            Deal.is_deleted.is_(False),
            Deal.pipeline_stage.notin_(["CLOSED WON", "CLOSED LOST", "closed_won", "closed_lost"]),
        )
        open_deals = open_deals_query.count()

        pipeline_value = (
            self.db.query(func.sum(Deal.estimated_value))
            .filter(
                Deal.is_deleted.is_(False),
                Deal.pipeline_stage.notin_(["CLOSED WON", "CLOSED LOST", "closed_won", "closed_lost"]),
            )
            .scalar()
            or Decimal("0.00")
        )

        won_revenue = (
            self.db.query(func.sum(Deal.estimated_value))
            .filter(
                Deal.is_deleted.is_(False),
                Deal.pipeline_stage.in_(["CLOSED WON", "closed_won"]),
            )
            .scalar()
            or Decimal("0.00")
        )

        lost_deals = (
            self.db.query(func.count(Deal.id))
            .filter(
                Deal.is_deleted.is_(False),
                Deal.pipeline_stage.in_(["CLOSED LOST", "closed_lost"]),
            )
            .scalar()
            or 0
        )

        won_deals_count = (
            self.db.query(func.count(Deal.id))
            .filter(
                Deal.is_deleted.is_(False),
                Deal.pipeline_stage.in_(["CLOSED WON", "closed_won"]),
            )
            .scalar()
            or 0
        )

        # Conversion rate: won deals / (won + lost) if any, or won / total deals
        closed_deals = won_deals_count + lost_deals
        if closed_deals > 0:
            conversion_rate = round((won_deals_count / closed_deals) * 100, 1)
        else:
            total_active = open_deals + won_deals_count
            conversion_rate = round((won_deals_count / total_active * 100), 1) if total_active > 0 else 0.0

        # Average deal value
        total_deals_count = self.db.query(func.count(Deal.id)).filter(Deal.is_deleted.is_(False)).scalar() or 0
        total_deals_sum = (
            self.db.query(func.sum(Deal.estimated_value)).filter(Deal.is_deleted.is_(False)).scalar()
            or Decimal("0.00")
        )
        average_deal_value = (
            Decimal(round(total_deals_sum / total_deals_count, 2))
            if total_deals_count > 0
            else Decimal("0.00")
        )

        # Stage distribution
        stage_counts = (
            self.db.query(Deal.pipeline_stage, func.count(Deal.id))
            .filter(Deal.is_deleted.is_(False))
            .group_by(Deal.pipeline_stage)
            .all()
        )
        stage_distribution = {stage: count for stage, count in stage_counts}

        # Salesperson performance
        salesperson_perf = []
        users = self.db.query(User).filter(User.is_active.is_(True)).all()
        for user in users:
            user_deals = (
                self.db.query(Deal)
                .filter(Deal.owner_user_id == user.id, Deal.is_deleted.is_(False))
                .all()
            )
            if user_deals:
                u_deals_count = len(user_deals)
                u_won_deals = [d for d in user_deals if d.pipeline_stage in ["CLOSED WON", "closed_won"]]
                u_won_count = len(u_won_deals)
                u_won_rev = sum(d.estimated_value for d in u_won_deals)
                u_open_deals = [
                    d
                    for d in user_deals
                    if d.pipeline_stage not in ["CLOSED WON", "CLOSED LOST", "closed_won", "closed_lost"]
                ]
                u_pipeline_val = sum(d.estimated_value for d in u_open_deals)
                u_win_rate = round((u_won_count / u_deals_count) * 100, 1) if u_deals_count > 0 else 0.0

                salesperson_perf.append(
                    {
                        "user_id": user.id,
                        "full_name": user.full_name,
                        "deals_count": u_deals_count,
                        "won_deals_count": u_won_count,
                        "won_revenue": u_won_rev,
                        "pipeline_value": u_pipeline_val,
                        "win_rate": u_win_rate,
                    }
                )

        # Sort salesperson performance by won_revenue descending
        salesperson_perf.sort(key=lambda x: x["won_revenue"], reverse=True)

        return {
            "new_leads": new_leads,
            "qualified_leads": qualified_leads,
            "open_deals": open_deals,
            "pipeline_value": pipeline_value,
            "won_revenue": won_revenue,
            "lost_deals": lost_deals,
            "conversion_rate": conversion_rate,
            "average_deal_value": average_deal_value,
            "salesperson_performance": salesperson_perf,
            "stage_distribution": stage_distribution,
        }
