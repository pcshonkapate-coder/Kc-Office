from typing import List, Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user_flexible, get_current_active_user, require_permission
from app.models.auth import User
from app.models.crm import Service, Company, Contact, Lead, Deal, Activity
from app.repositories.crm_repository import CRMRepository
from app.services.crm_service import CRMService
from app.schemas.crm import (
    PublicLeadCreate,
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    CompanyCreate,
    CompanyUpdate,
    CompanyResponse,
    CompanyDetailResponse,
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    LeadCreate,
    LeadUpdate,
    LeadConvertRequest,
    LeadResponse,
    DealCreate,
    DealUpdate,
    DealStageChangeRequest,
    DealStageHistoryResponse,
    DealResponse,
    DealDetailResponse,
    ActivityCreate,
    ActivityUpdate,
    ActivityResponse,
    CRMDashboardMetrics,
)
from app.core.exceptions import KapateAppException
from app.core.logging import logger

router = APIRouter()


# ==================== CRM DASHBOARD & ANALYTICS ====================
@router.get(
    "/dashboard",
    response_model=CRMDashboardMetrics,
    status_code=status.HTTP_200_OK,
    tags=["CRM Analytics"],
)
def get_crm_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Real-time database aggregated metrics for the CRM pipeline dashboard:
    new leads, qualified leads, open deals, pipeline value, won revenue,
    conversion rate, average deal size, and salesperson performance leaderboard.
    """
    repo = CRMRepository(db)
    return repo.get_dashboard_metrics()


# ==================== CONFIGURABLE SERVICES ====================
@router.get(
    "/services",
    response_model=List[ServiceResponse],
    status_code=status.HTTP_200_OK,
    tags=["CRM Services"],
)
def list_services(
    active_only: bool = Query(False, description="Filter only active services"),
    db: Session = Depends(get_db),
):
    """
    List configurable consultancy services (AI Development, Machine Learning,
    Custom Software, Cloud Solutions, etc.).
    """
    repo = CRMRepository(db)
    return repo.get_services(active_only=active_only)


@router.post(
    "/services",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["CRM Services"],
)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("crm:services:manage")),
):
    """
    Admin-only endpoint to register a new configurable consultancy service.
    """
    repo = CRMRepository(db)
    code = (payload.code or payload.name.lower().replace(" ", "_").replace("&", "and")).strip()

    existing = repo.get_service_by_code(code)
    if existing:
        raise KapateAppException(
            status_code=400, detail=f"Service with code '{code}' already exists."
        )

    service = Service(
        name=payload.name.strip(),
        code=code,
        description=payload.description,
        category=payload.category,
        is_active=payload.is_active,
    )
    created = repo.create_service(service)
    logger.info(f"Admin '{current_user.email}' added service: '{created.name}'")
    return created


@router.put(
    "/services/{service_id}",
    response_model=ServiceResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Services"],
)
def update_service(
    service_id: str,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("crm:services:manage")),
):
    """
    Admin-only endpoint to update service attributes or active status.
    """
    repo = CRMRepository(db)
    service = repo.get_service_by_id(service_id)
    if not service:
        raise KapateAppException(status_code=404, detail="Service not found.")

    updated = repo.update_service(service, payload.model_dump(exclude_unset=True))
    logger.info(f"Admin '{current_user.email}' updated service: '{updated.name}'")
    return updated


@router.delete(
    "/services/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["CRM Services"],
)
def delete_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("crm:services:manage")),
):
    """
    Admin-only endpoint to remove a service from the catalog.
    """
    repo = CRMRepository(db)
    service = repo.get_service_by_id(service_id)
    if not service:
        raise KapateAppException(status_code=404, detail="Service not found.")

    repo.delete_service(service)
    logger.info(f"Admin '{current_user.email}' deleted service: '{service.name}'")
    return None


# ==================== COMPANY MANAGEMENT ====================
@router.get(
    "/companies",
    response_model=List[CompanyResponse],
    status_code=status.HTTP_200_OK,
    tags=["CRM Companies"],
)
def list_companies(
    search: Optional[str] = Query(None, description="Search by name, city, industry"),
    industry: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    List client organizations with optional search, industry, and country filters.
    Includes counts of contacts, deals, and total deal pipeline value.
    """
    repo = CRMRepository(db)
    companies = repo.get_companies(
        search=search, industry=industry, country=country, limit=limit, offset=offset
    )

    results = []
    for c in companies:
        c_dict = {
            "id": c.id,
            "name": c.name,
            "domain": c.domain,
            "industry": c.industry,
            "website": c.website,
            "gst_number": c.gst_number,
            "tax_id": c.tax_id or c.gst_number,
            "company_size": c.company_size,
            "source": c.source,
            "address": c.address,
            "city": c.city,
            "country": c.country,
            "notes": c.notes,
            "contacts_count": len([ct for ct in c.contacts if not ct.is_deleted]),
            "deals_count": len([d for d in c.deals if not d.is_deleted]),
            "total_deal_value": sum(d.estimated_value for d in c.deals if not d.is_deleted),
            "created_at": c.created_at,
        }
        results.append(c_dict)
    return results


@router.post(
    "/companies",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["CRM Companies"],
)
def create_company(
    payload: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Create a new client company profile.
    """
    repo = CRMRepository(db)
    company = Company(
        name=payload.name.strip(),
        industry=payload.industry,
        website=payload.website,
        domain=payload.domain,
        gst_number=payload.gst_number or payload.tax_id,
        tax_id=payload.tax_id or payload.gst_number,
        company_size=payload.company_size,
        source=payload.source,
        address=payload.address,
        city=payload.city,
        country=payload.country or "India",
        notes=payload.notes,
    )
    created = repo.create_company(company)
    return CompanyResponse(
        id=created.id,
        name=created.name,
        industry=created.industry,
        website=created.website,
        domain=created.domain,
        gst_number=created.gst_number,
        tax_id=created.tax_id,
        company_size=created.company_size,
        source=created.source,
        address=created.address,
        city=created.city,
        country=created.country,
        notes=created.notes,
        contacts_count=0,
        deals_count=0,
        total_deal_value=Decimal("0.00"),
        created_at=created.created_at,
    )


@router.get(
    "/companies/{company_id}",
    response_model=CompanyDetailResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Companies"],
)
def get_company_details(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Get detailed company record including list of associated contacts.
    """
    repo = CRMRepository(db)
    company = repo.get_company_by_id(company_id)
    if not company:
        raise KapateAppException(status_code=404, detail="Company not found.")

    active_contacts = [
        ContactResponse(
            id=ct.id,
            company_id=ct.company_id,
            company_name=company.name,
            name=ct.name,
            email=ct.email,
            phone=ct.phone,
            job_title=ct.job_title or ct.designation,
            designation=ct.designation or ct.job_title,
            role_in_buying_process=ct.role_in_buying_process,
            notes=ct.notes,
            is_primary=ct.is_primary,
            created_at=ct.created_at,
        )
        for ct in company.contacts
        if not ct.is_deleted
    ]

    return CompanyDetailResponse(
        id=company.id,
        name=company.name,
        domain=company.domain,
        industry=company.industry,
        website=company.website,
        gst_number=company.gst_number,
        tax_id=company.tax_id or company.gst_number,
        company_size=company.company_size,
        source=company.source,
        address=company.address,
        city=company.city,
        country=company.country,
        notes=company.notes,
        contacts_count=len(active_contacts),
        deals_count=len([d for d in company.deals if not d.is_deleted]),
        total_deal_value=sum(d.estimated_value for d in company.deals if not d.is_deleted),
        contacts=active_contacts,
        created_at=company.created_at,
    )


@router.put(
    "/companies/{company_id}",
    response_model=CompanyResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Companies"],
)
def update_company(
    company_id: str,
    payload: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Update company profile.
    """
    repo = CRMRepository(db)
    company = repo.get_company_by_id(company_id)
    if not company:
        raise KapateAppException(status_code=404, detail="Company not found.")

    data = payload.model_dump(exclude_unset=True)
    if "tax_id" in data and not data.get("gst_number"):
        data["gst_number"] = data["tax_id"]
    updated = repo.update_company(company, data)

    return CompanyResponse(
        id=updated.id,
        name=updated.name,
        domain=updated.domain,
        industry=updated.industry,
        website=updated.website,
        gst_number=updated.gst_number,
        tax_id=updated.tax_id or updated.gst_number,
        company_size=updated.company_size,
        source=updated.source,
        address=updated.address,
        city=updated.city,
        country=updated.country,
        notes=updated.notes,
        contacts_count=len([ct for ct in updated.contacts if not ct.is_deleted]),
        deals_count=len([d for d in updated.deals if not d.is_deleted]),
        total_deal_value=sum(d.estimated_value for d in updated.deals if not d.is_deleted),
        created_at=updated.created_at,
    )


@router.delete(
    "/companies/{company_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["CRM Companies"],
)
def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Soft-delete a company record.
    """
    repo = CRMRepository(db)
    company = repo.get_company_by_id(company_id)
    if not company:
        raise KapateAppException(status_code=404, detail="Company not found.")

    repo.delete_company(company)
    return None


# ==================== CONTACT MANAGEMENT ====================
@router.get(
    "/contacts",
    response_model=List[ContactResponse],
    status_code=status.HTTP_200_OK,
    tags=["CRM Contacts"],
)
def list_contacts(
    company_id: Optional[str] = Query(None, description="Filter by company"),
    search: Optional[str] = Query(None, description="Search by name, email, phone"),
    role: Optional[str] = Query(None, description="Role in buying process: CEO, CTO, VP Product, Finance, Technical Lead, etc."),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    List client contacts directory supporting multiple contacts per company,
    filtering by company, role in buying process, or keyword search.
    """
    repo = CRMRepository(db)
    contacts = repo.get_contacts(
        company_id=company_id, search=search, role=role, limit=limit, offset=offset
    )
    return [
        ContactResponse(
            id=ct.id,
            company_id=ct.company_id,
            company_name=ct.company.name if ct.company else None,
            name=ct.name,
            email=ct.email,
            phone=ct.phone,
            job_title=ct.job_title or ct.designation,
            designation=ct.designation or ct.job_title,
            role_in_buying_process=ct.role_in_buying_process,
            notes=ct.notes,
            is_primary=ct.is_primary,
            created_at=ct.created_at,
        )
        for ct in contacts
    ]


@router.post(
    "/contacts",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["CRM Contacts"],
)
def create_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Create a new client contact linked to a company.
    """
    repo = CRMRepository(db)
    company = repo.get_company_by_id(payload.company_id)
    if not company:
        raise KapateAppException(status_code=404, detail="Company not found.")

    contact = Contact(
        company_id=payload.company_id,
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone,
        job_title=payload.job_title,
        designation=payload.job_title,
        role_in_buying_process=payload.role_in_buying_process,
        notes=payload.notes,
        is_primary=payload.is_primary,
    )
    created = repo.create_contact(contact)
    return ContactResponse(
        id=created.id,
        company_id=created.company_id,
        company_name=company.name,
        name=created.name,
        email=created.email,
        phone=created.phone,
        job_title=created.job_title,
        designation=created.designation,
        role_in_buying_process=created.role_in_buying_process,
        notes=created.notes,
        is_primary=created.is_primary,
        created_at=created.created_at,
    )


@router.get(
    "/contacts/{contact_id}",
    response_model=ContactResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Contacts"],
)
def get_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    repo = CRMRepository(db)
    contact = repo.get_contact_by_id(contact_id)
    if not contact:
        raise KapateAppException(status_code=404, detail="Contact not found.")

    return ContactResponse(
        id=contact.id,
        company_id=contact.company_id,
        company_name=contact.company.name if contact.company else None,
        name=contact.name,
        email=contact.email,
        phone=contact.phone,
        job_title=contact.job_title or contact.designation,
        designation=contact.designation or contact.job_title,
        role_in_buying_process=contact.role_in_buying_process,
        notes=contact.notes,
        is_primary=contact.is_primary,
        created_at=contact.created_at,
    )


@router.put(
    "/contacts/{contact_id}",
    response_model=ContactResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Contacts"],
)
def update_contact(
    contact_id: str,
    payload: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    repo = CRMRepository(db)
    contact = repo.get_contact_by_id(contact_id)
    if not contact:
        raise KapateAppException(status_code=404, detail="Contact not found.")

    data = payload.model_dump(exclude_unset=True)
    if "job_title" in data:
        data["designation"] = data["job_title"]
    updated = repo.update_contact(contact, data)

    return ContactResponse(
        id=updated.id,
        company_id=updated.company_id,
        company_name=updated.company.name if updated.company else None,
        name=updated.name,
        email=updated.email,
        phone=updated.phone,
        job_title=updated.job_title or updated.designation,
        designation=updated.designation or updated.job_title,
        role_in_buying_process=updated.role_in_buying_process,
        notes=updated.notes,
        is_primary=updated.is_primary,
        created_at=updated.created_at,
    )


@router.delete(
    "/contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["CRM Contacts"],
)
def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    repo = CRMRepository(db)
    contact = repo.get_contact_by_id(contact_id)
    if not contact:
        raise KapateAppException(status_code=404, detail="Contact not found.")

    repo.delete_contact(contact)
    return None


# ==================== LEAD RECORD MANAGEMENT ====================
@router.get(
    "/leads",
    response_model=List[LeadResponse],
    status_code=status.HTTP_200_OK,
    tags=["CRM Leads"],
)
def list_leads(
    search: Optional[str] = Query(None, description="Search name, company, email, lead code"),
    source: Optional[str] = Query(None, description="Website contact form, Consultation form, Referral, Email, LinkedIn, Cold outreach, Manual entry, Other"),
    service_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    salesperson_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Search and filter leads across all dimensions: source, service, priority,
    salesperson, status, and search query.
    """
    repo = CRMRepository(db)
    leads = repo.get_leads(
        search=search,
        source=source,
        service_id=service_id,
        status=status,
        priority=priority,
        salesperson_id=salesperson_id,
        limit=limit,
        offset=offset,
    )
    return [
        LeadResponse(
            id=l.id,
            lead_code=l.lead_code,
            name=l.name or l.contact_name,
            contact_name=l.contact_name or l.name,
            company_name=l.company_name,
            email=l.email,
            phone=l.phone,
            country=l.country or "India",
            city=l.city,
            job_title=l.job_title,
            service_id=l.service_id,
            service_name=l.service.name if l.service else l.service_interest,
            service_interest=l.service_interest or (l.service.name if l.service else None),
            budget=l.budget or l.budget_range,
            currency=l.currency or "INR",
            project_description=l.project_description or l.brief,
            source=l.source,
            priority=l.priority,
            lead_score=l.lead_score,
            assigned_salesperson_id=l.assigned_salesperson_id,
            assigned_salesperson_name=l.assigned_salesperson.full_name if l.assigned_salesperson else None,
            status=l.status,
            last_contacted_at=l.last_contacted_at,
            next_follow_up_at=l.next_follow_up_at,
            notes=l.notes,
            converted_deal_id=l.converted_deal_id,
            created_at=l.created_at,
            updated_at=l.updated_at,
        )
        for l in leads
    ]


@router.post(
    "/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["CRM Leads"],
)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Create an internal lead record with full attributes.
    """
    repo = CRMRepository(db)
    service_name = None
    if payload.service_id:
        svc = repo.get_service_by_id(payload.service_id)
        if svc:
            service_name = svc.name

    lead = Lead(
        name=payload.name.strip(),
        contact_name=payload.name.strip(),
        company_name=payload.company_name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone,
        country=payload.country or "India",
        city=payload.city,
        job_title=payload.job_title,
        service_id=payload.service_id,
        service_interest=payload.service_interest or service_name,
        budget=payload.budget,
        budget_range=payload.budget,
        currency=payload.currency or "INR",
        project_description=payload.project_description,
        brief=payload.project_description,
        source=payload.source or "Manual entry",
        priority=payload.priority or "medium",
        lead_score=payload.lead_score,
        assigned_salesperson_id=payload.assigned_salesperson_id or current_user.id,
        status=payload.status or "NEW LEAD",
        last_contacted_at=payload.last_contacted_at,
        next_follow_up_at=payload.next_follow_up_at,
        notes=payload.notes,
    )
    created = repo.create_lead(lead)
    logger.info(f"Lead created: #{created.lead_code} - {created.name} ({created.company_name})")

    return LeadResponse(
        id=created.id,
        lead_code=created.lead_code,
        name=created.name,
        contact_name=created.contact_name,
        company_name=created.company_name,
        email=created.email,
        phone=created.phone,
        country=created.country,
        city=created.city,
        job_title=created.job_title,
        service_id=created.service_id,
        service_name=created.service.name if created.service else created.service_interest,
        service_interest=created.service_interest,
        budget=created.budget,
        currency=created.currency,
        project_description=created.project_description,
        source=created.source,
        priority=created.priority,
        lead_score=created.lead_score,
        assigned_salesperson_id=created.assigned_salesperson_id,
        assigned_salesperson_name=created.assigned_salesperson.full_name if created.assigned_salesperson else None,
        status=created.status,
        last_contacted_at=created.last_contacted_at,
        next_follow_up_at=created.next_follow_up_at,
        notes=created.notes,
        converted_deal_id=created.converted_deal_id,
        created_at=created.created_at,
        updated_at=created.updated_at,
    )


@router.get(
    "/leads/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Leads"],
)
def get_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    repo = CRMRepository(db)
    lead = repo.get_lead_by_id(lead_id)
    if not lead:
        raise KapateAppException(status_code=404, detail="Lead not found.")

    return LeadResponse(
        id=lead.id,
        lead_code=lead.lead_code,
        name=lead.name or lead.contact_name,
        contact_name=lead.contact_name or lead.name,
        company_name=lead.company_name,
        email=lead.email,
        phone=lead.phone,
        country=lead.country,
        city=lead.city,
        job_title=lead.job_title,
        service_id=lead.service_id,
        service_name=lead.service.name if lead.service else lead.service_interest,
        service_interest=lead.service_interest,
        budget=lead.budget or lead.budget_range,
        currency=lead.currency,
        project_description=lead.project_description or lead.brief,
        source=lead.source,
        priority=lead.priority,
        lead_score=lead.lead_score,
        assigned_salesperson_id=lead.assigned_salesperson_id,
        assigned_salesperson_name=lead.assigned_salesperson.full_name if lead.assigned_salesperson else None,
        status=lead.status,
        last_contacted_at=lead.last_contacted_at,
        next_follow_up_at=lead.next_follow_up_at,
        notes=lead.notes,
        converted_deal_id=lead.converted_deal_id,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
    )


@router.put(
    "/leads/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Leads"],
)
def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    repo = CRMRepository(db)
    lead = repo.get_lead_by_id(lead_id)
    if not lead:
        raise KapateAppException(status_code=404, detail="Lead not found.")

    updated = repo.update_lead(lead, payload.model_dump(exclude_unset=True))
    return LeadResponse(
        id=updated.id,
        lead_code=updated.lead_code,
        name=updated.name or updated.contact_name,
        contact_name=updated.contact_name or updated.name,
        company_name=updated.company_name,
        email=updated.email,
        phone=updated.phone,
        country=updated.country,
        city=updated.city,
        job_title=updated.job_title,
        service_id=updated.service_id,
        service_name=updated.service.name if updated.service else updated.service_interest,
        service_interest=updated.service_interest,
        budget=updated.budget,
        currency=updated.currency,
        project_description=updated.project_description,
        source=updated.source,
        priority=updated.priority,
        lead_score=updated.lead_score,
        assigned_salesperson_id=updated.assigned_salesperson_id,
        assigned_salesperson_name=updated.assigned_salesperson.full_name if updated.assigned_salesperson else None,
        status=updated.status,
        last_contacted_at=updated.last_contacted_at,
        next_follow_up_at=updated.next_follow_up_at,
        notes=updated.notes,
        converted_deal_id=updated.converted_deal_id,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )


@router.delete(
    "/leads/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["CRM Leads"],
)
def delete_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    repo = CRMRepository(db)
    lead = repo.get_lead_by_id(lead_id)
    if not lead:
        raise KapateAppException(status_code=404, detail="Lead not found.")

    repo.delete_lead(lead)
    return None


@router.post(
    "/leads/{lead_id}/convert",
    response_model=DealResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["CRM Leads"],
)
def convert_lead_to_deal(
    lead_id: str,
    payload: LeadConvertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    One-click Lead Conversion: converts an inbound/qualified lead into a formal Company,
    primary Contact, and an active Deal in the Sales Pipeline.
    """
    service = CRMService(db)
    company, contact, deal = service.convert_lead_to_deal(
        lead_id=lead_id, convert_data=payload, current_user_id=current_user.id
    )

    return DealResponse(
        id=deal.id,
        title=deal.title,
        company_id=company.id,
        company_name=company.name,
        primary_contact_id=contact.id,
        primary_contact_name=contact.name,
        primary_contact_email=contact.email,
        lead_id=lead_id,
        service_id=deal.service_id,
        service_name=deal.service.name if deal.service else None,
        estimated_value=deal.estimated_value,
        currency=deal.currency,
        expected_close_date=deal.expected_close_date,
        pipeline_stage=deal.pipeline_stage,
        win_probability=deal.win_probability,
        owner_user_id=deal.owner_user_id,
        owner_name=deal.owner.full_name if deal.owner else None,
        notes=deal.notes,
        created_at=deal.created_at,
        updated_at=deal.updated_at,
    )


# ==================== SALES PIPELINE & DEALS ====================
@router.get(
    "/deals",
    response_model=List[DealResponse],
    status_code=status.HTTP_200_OK,
    tags=["CRM Deals"],
)
def list_deals(
    search: Optional[str] = Query(None, description="Search deal title or company"),
    company_id: Optional[str] = Query(None),
    contact_id: Optional[str] = Query(None),
    service_id: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    owner_id: Optional[str] = Query(None),
    min_value: Optional[float] = Query(None),
    max_value: Optional[float] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    List deals across the sales pipeline with comprehensive multi-criteria filtering:
    Company, Contact, Service, Stage, Owner, Date range, and Value range.
    """
    repo = CRMRepository(db)
    deals = repo.get_deals(
        search=search,
        company_id=company_id,
        contact_id=contact_id,
        service_id=service_id,
        stage=stage,
        owner_id=owner_id,
        min_value=min_value,
        max_value=max_value,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    return [
        DealResponse(
            id=d.id,
            title=d.title,
            company_id=d.company_id,
            company_name=d.company.name if d.company else None,
            primary_contact_id=d.primary_contact_id,
            primary_contact_name=d.primary_contact.name if d.primary_contact else None,
            primary_contact_email=d.primary_contact.email if d.primary_contact else None,
            lead_id=d.lead_id,
            service_id=d.service_id,
            service_name=d.service.name if d.service else None,
            estimated_value=d.estimated_value,
            currency=d.currency,
            expected_close_date=d.expected_close_date,
            pipeline_stage=d.pipeline_stage,
            win_probability=d.win_probability,
            owner_user_id=d.owner_user_id,
            owner_name=d.owner.full_name if d.owner else None,
            notes=d.notes,
            created_at=d.created_at,
            updated_at=d.updated_at,
        )
        for d in deals
    ]


@router.post(
    "/deals",
    response_model=DealResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["CRM Deals"],
)
def create_deal(
    payload: DealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Create a new sales opportunity deal in the pipeline.
    """
    repo = CRMRepository(db)
    deal = Deal(
        title=payload.title.strip(),
        company_id=payload.company_id,
        primary_contact_id=payload.primary_contact_id,
        lead_id=payload.lead_id,
        service_id=payload.service_id,
        estimated_value=payload.estimated_value,
        currency=payload.currency or "INR",
        expected_close_date=payload.expected_close_date,
        pipeline_stage=payload.pipeline_stage or "NEW LEAD",
        win_probability=payload.win_probability,
        owner_user_id=payload.owner_user_id or current_user.id,
        notes=payload.notes,
    )
    created = repo.create_deal(deal)
    return DealResponse(
        id=created.id,
        title=created.title,
        company_id=created.company_id,
        company_name=created.company.name if created.company else None,
        primary_contact_id=created.primary_contact_id,
        primary_contact_name=created.primary_contact.name if created.primary_contact else None,
        primary_contact_email=created.primary_contact.email if created.primary_contact else None,
        lead_id=created.lead_id,
        service_id=created.service_id,
        service_name=created.service.name if created.service else None,
        estimated_value=created.estimated_value,
        currency=created.currency,
        expected_close_date=created.expected_close_date,
        pipeline_stage=created.pipeline_stage,
        win_probability=created.win_probability,
        owner_user_id=created.owner_user_id,
        owner_name=created.owner.full_name if created.owner else None,
        notes=created.notes,
        created_at=created.created_at,
        updated_at=created.updated_at,
    )


@router.get(
    "/deals/{deal_id}",
    response_model=DealDetailResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Deals"],
)
def get_deal_details(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Retrieve full deal details including chronological stage-change history and activities.
    """
    repo = CRMRepository(db)
    deal = repo.get_deal_by_id(deal_id)
    if not deal:
        raise KapateAppException(status_code=404, detail="Deal not found.")

    history = repo.get_stage_history(deal_id)
    activities = repo.get_activities(entity_type="deal", entity_id=deal_id)

    stage_hist_responses = [
        DealStageHistoryResponse(
            id=h.id,
            deal_id=h.deal_id,
            from_stage=h.from_stage,
            to_stage=h.to_stage,
            notes=h.notes,
            changed_by_name=h.changed_by.full_name if h.changed_by else "System",
            created_at=h.created_at,
        )
        for h in history
    ]

    activity_responses = [
        ActivityResponse(
            id=a.id,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            activity_type=a.activity_type,
            subject=a.subject,
            notes=a.notes,
            status=a.status,
            due_date=a.due_date,
            completed_at=a.completed_at,
            created_by_user_id=a.created_by_user_id,
            created_by_name=a.created_by.full_name if a.created_by else None,
            created_at=a.created_at,
        )
        for a in activities
    ]

    return DealDetailResponse(
        id=deal.id,
        title=deal.title,
        company_id=deal.company_id,
        company_name=deal.company.name if deal.company else None,
        primary_contact_id=deal.primary_contact_id,
        primary_contact_name=deal.primary_contact.name if deal.primary_contact else None,
        primary_contact_email=deal.primary_contact.email if deal.primary_contact else None,
        lead_id=deal.lead_id,
        service_id=deal.service_id,
        service_name=deal.service.name if deal.service else None,
        estimated_value=deal.estimated_value,
        currency=deal.currency,
        expected_close_date=deal.expected_close_date,
        pipeline_stage=deal.pipeline_stage,
        win_probability=deal.win_probability,
        owner_user_id=deal.owner_user_id,
        owner_name=deal.owner.full_name if deal.owner else None,
        notes=deal.notes,
        created_at=deal.created_at,
        updated_at=deal.updated_at,
        stage_history=stage_hist_responses,
        activities=activity_responses,
    )


@router.put(
    "/deals/{deal_id}",
    response_model=DealResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Deals"],
)
def update_deal(
    deal_id: str,
    payload: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    repo = CRMRepository(db)
    deal = repo.get_deal_by_id(deal_id)
    if not deal:
        raise KapateAppException(status_code=404, detail="Deal not found.")

    data = payload.model_dump(exclude_unset=True)
    # If stage changed via general update, also record history
    if "pipeline_stage" in data and data["pipeline_stage"] != deal.pipeline_stage:
        repo.record_stage_change(
            deal=deal,
            new_stage=data["pipeline_stage"],
            win_probability=data.get("win_probability"),
            user_id=current_user.id,
        )
        del data["pipeline_stage"]
        if "win_probability" in data:
            del data["win_probability"]

    updated = repo.update_deal(deal, data)
    return DealResponse(
        id=updated.id,
        title=updated.title,
        company_id=updated.company_id,
        company_name=updated.company.name if updated.company else None,
        primary_contact_id=updated.primary_contact_id,
        primary_contact_name=updated.primary_contact.name if updated.primary_contact else None,
        primary_contact_email=updated.primary_contact.email if updated.primary_contact else None,
        lead_id=updated.lead_id,
        service_id=updated.service_id,
        service_name=updated.service.name if updated.service else None,
        estimated_value=updated.estimated_value,
        currency=updated.currency,
        expected_close_date=updated.expected_close_date,
        pipeline_stage=updated.pipeline_stage,
        win_probability=updated.win_probability,
        owner_user_id=updated.owner_user_id,
        owner_name=updated.owner.full_name if updated.owner else None,
        notes=updated.notes,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )


@router.put(
    "/deals/{deal_id}/stage",
    response_model=DealStageHistoryResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Deals"],
)
def update_deal_stage(
    deal_id: str,
    payload: DealStageChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Dedicated Drag-and-Drop stage change endpoint.
    Transitions deal stage, records stage history entry, and recalculates win probability.
    """
    repo = CRMRepository(db)
    deal = repo.get_deal_by_id(deal_id)
    if not deal:
        raise KapateAppException(status_code=404, detail="Deal not found.")

    history = repo.record_stage_change(
        deal=deal,
        new_stage=payload.pipeline_stage,
        notes=payload.notes,
        win_probability=payload.win_probability,
        user_id=current_user.id,
    )

    logger.info(
        f"Deal '{deal.title}' stage moved to '{payload.pipeline_stage}' by '{current_user.email}'"
    )
    return DealStageHistoryResponse(
        id=history.id,
        deal_id=history.deal_id,
        from_stage=history.from_stage,
        to_stage=history.to_stage,
        notes=history.notes,
        changed_by_name=current_user.full_name,
        created_at=history.created_at,
    )


@router.get(
    "/deals/{deal_id}/history",
    response_model=List[DealStageHistoryResponse],
    status_code=status.HTTP_200_OK,
    tags=["CRM Deals"],
)
def get_deal_stage_history(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Get full timeline history of stage changes for a deal.
    """
    repo = CRMRepository(db)
    history = repo.get_stage_history(deal_id)
    return [
        DealStageHistoryResponse(
            id=h.id,
            deal_id=h.deal_id,
            from_stage=h.from_stage,
            to_stage=h.to_stage,
            notes=h.notes,
            changed_by_name=h.changed_by.full_name if h.changed_by else "System",
            created_at=h.created_at,
        )
        for h in history
    ]


@router.post(
    "/deals/{deal_id}/convert-to-project",
    status_code=status.HTTP_201_CREATED,
    tags=["CRM Deals"],
)
def convert_won_deal_to_project(
    deal_id: str,
    project_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Converts a Won deal into an executed Contract and Project,
    bridging CRM to Project Delivery & Finance.
    """
    service = CRMService(db)
    contract, project = service.convert_won_deal_to_project(
        deal_id=deal_id, current_user_id=current_user.id, project_name=project_name
    )
    return {
        "success": True,
        "message": f"Successfully created Contract #{contract.id} and Project '{project.name}' ({project.project_code})",
        "data": {
            "contract_id": contract.id,
            "contract_type": contract.contract_type,
            "project_id": project.id,
            "project_code": project.project_code,
            "project_name": project.name,
            "budget": project.budget,
        },
    }


@router.delete(
    "/deals/{deal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["CRM Deals"],
)
def delete_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    repo = CRMRepository(db)
    deal = repo.get_deal_by_id(deal_id)
    if not deal:
        raise KapateAppException(status_code=404, detail="Deal not found.")

    repo.delete_deal(deal)
    return None


# ==================== ACTIVITIES ====================
@router.get(
    "/activities",
    response_model=List[ActivityResponse],
    status_code=status.HTTP_200_OK,
    tags=["CRM Activities"],
)
def list_activities(
    entity_type: Optional[str] = Query(None, description="lead, deal, company, contact"),
    entity_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    List activity history (calls, emails, meetings, notes, follow-ups, tasks)
    filtered by entity type and entity ID.
    """
    repo = CRMRepository(db)
    activities = repo.get_activities(entity_type=entity_type, entity_id=entity_id, limit=limit)
    return [
        ActivityResponse(
            id=a.id,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            activity_type=a.activity_type,
            subject=a.subject,
            notes=a.notes,
            status=a.status,
            due_date=a.due_date,
            completed_at=a.completed_at,
            created_by_user_id=a.created_by_user_id,
            created_by_name=a.created_by.full_name if a.created_by else None,
            created_at=a.created_at,
        )
        for a in activities
    ]


@router.post(
    "/activities",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["CRM Activities"],
)
def create_activity(
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    """
    Log an activity (call, email, meeting, note, follow-up, task) against any CRM entity.
    """
    repo = CRMRepository(db)
    activity = Activity(
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        activity_type=payload.activity_type,
        subject=payload.subject,
        notes=payload.notes,
        status=payload.status,
        due_date=payload.due_date,
        completed_at=payload.completed_at,
        created_by_user_id=current_user.id,
    )
    created = repo.create_activity(activity)
    return ActivityResponse(
        id=created.id,
        entity_type=created.entity_type,
        entity_id=created.entity_id,
        activity_type=created.activity_type,
        subject=created.subject,
        notes=created.notes,
        status=created.status,
        due_date=created.due_date,
        completed_at=created.completed_at,
        created_by_user_id=created.created_by_user_id,
        created_by_name=current_user.full_name,
        created_at=created.created_at,
    )


@router.put(
    "/activities/{activity_id}",
    response_model=ActivityResponse,
    status_code=status.HTTP_200_OK,
    tags=["CRM Activities"],
)
def update_activity(
    activity_id: str,
    payload: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    repo = CRMRepository(db)
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise KapateAppException(status_code=404, detail="Activity not found.")

    updated = repo.update_activity(activity, payload.model_dump(exclude_unset=True))
    return ActivityResponse(
        id=updated.id,
        entity_type=updated.entity_type,
        entity_id=updated.entity_id,
        activity_type=updated.activity_type,
        subject=updated.subject,
        notes=updated.notes,
        status=updated.status,
        due_date=updated.due_date,
        completed_at=updated.completed_at,
        created_by_user_id=updated.created_by_user_id,
        created_by_name=updated.created_by.full_name if updated.created_by else None,
        created_at=updated.created_at,
    )


@router.delete(
    "/activities/{activity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["CRM Activities"],
)
def delete_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    repo = CRMRepository(db)
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise KapateAppException(status_code=404, detail="Activity not found.")

    repo.delete_activity(activity)
    return None


# ==================== PUBLIC CRM INGESTION ====================
@router.post(
    "/leads/public",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["CRM Public API"],
)
def create_public_lead(payload: PublicLeadCreate, db: Session = Depends(get_db)):
    """
    Public ingestion endpoint for consultation requests submitted from website contact.html.
    Creates an immutable lead record and logs an inbound inquiry event.
    """
    repo = CRMRepository(db)
    lead = Lead(
        name=payload.name.strip(),
        contact_name=payload.name.strip(),
        company_name=(payload.company or f"{payload.name}'s Enterprise").strip(),
        email=payload.email.lower().strip(),
        phone=payload.phone,
        service_interest=payload.service,
        budget=payload.budget,
        budget_range=payload.budget,
        project_description=payload.message,
        brief=payload.message,
        source="Website contact form",
        priority="high" if payload.budget and any(k in payload.budget.lower() for k in ["50k", "100k", "1cr", "50l"]) else "medium",
        lead_score=75,
        status="NEW LEAD",
    )
    created = repo.create_lead(lead)
    logger.info(
        f"New inbound public lead: '{created.name}' ({created.email}) for service '{created.service_interest}'"
    )
    return LeadResponse(
        id=created.id,
        lead_code=created.lead_code,
        name=created.name,
        contact_name=created.contact_name,
        company_name=created.company_name,
        email=created.email,
        phone=created.phone,
        country=created.country,
        city=created.city,
        job_title=created.job_title,
        service_id=created.service_id,
        service_name=created.service_interest,
        service_interest=created.service_interest,
        budget=created.budget,
        currency=created.currency,
        project_description=created.project_description,
        source=created.source,
        priority=created.priority,
        lead_score=created.lead_score,
        assigned_salesperson_id=created.assigned_salesperson_id,
        assigned_salesperson_name=None,
        status=created.status,
        last_contacted_at=created.last_contacted_at,
        next_follow_up_at=created.next_follow_up_at,
        notes=created.notes,
        converted_deal_id=created.converted_deal_id,
        created_at=created.created_at,
        updated_at=created.updated_at,
    )

# --- Reminders ---
from app.models.crm import FollowUpReminder
from app.schemas.crm import FollowUpReminderCreate, FollowUpReminderResponse

@router.post("/reminders", response_model=FollowUpReminderResponse)
def create_reminder(
    data: FollowUpReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    reminder = FollowUpReminder(
        user_id=current_user.id,
        entity_type=data.entity_type,
        entity_id=data.entity_id,
        message=data.message,
        due_date=data.due_date
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder
