from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.crm import PublicLeadCreate, PublicSubmissionResponse, LeadResponse
from app.services.crm_service import CRMService
from app.core.rate_limit import public_lead_rate_limiter
from app.core.exceptions import KapateAppException
from app.core.logging import logger

router = APIRouter()


@router.post(
    "/leads",
    response_model=PublicSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Public Leads API"],
)
def submit_public_consultation_lead(
    payload: PublicLeadCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public consultation request ingestion endpoint:
    - Enforces rate limiting per IP
    - Strips malicious markup & checks honeypot
    - Detects duplicates & logs timeline activity
    - Dispatches confirmation & notifies sales
    """
    client_ip = (
        request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or request.client.host
        if request.client
        else "127.0.0.1"
    )

    # 1. Rate limiting check
    if not public_lead_rate_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit exceeded for public lead ingestion from IP: {client_ip}")
        raise KapateAppException(
            status_code=429,
            detail="Too many consultation requests from your IP. Please wait a minute before trying again.",
        )

    # 2. Process submission in CRM
    service = CRMService(db)
    lead, is_duplicate = service.process_public_lead_submission(payload, client_ip=client_ip)

    return PublicSubmissionResponse(
        success=True,
        message="Thank you. Your consultation request has been received. Our team will contact you shortly.",
        lead_code=lead.lead_code,
        is_duplicate=is_duplicate,
        created_at=lead.created_at,
    )
