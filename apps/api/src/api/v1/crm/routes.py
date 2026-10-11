from datetime import date, datetime, timezone
import hashlib
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.dependencies.auth import (
    AuthenticatedUserContext,
    get_current_user_context,
    require_permissions,
)
from src.core.database import get_db_session
from src.models.crm import (
    Account,
    Contact,
    Contract,
    Lead,
    Opportunity,
    Proposal,
)
from src.schemas.crm import (
    Account360Detail,
    AccountCreate,
    AccountRead,
    ContactCreate,
    ContactRead,
    ContractCreate,
    ContractRead,
    ContractSignRequest,
    LeadConvertRequest,
    LeadCreate,
    LeadRead,
    OpportunityCreate,
    OpportunityRead,
    OpportunityStageUpdate,
    ProposalCreate,
    ProposalRead,
)

router = APIRouter(prefix="/crm", tags=["CRM & Client Lifecycle"])


# -------------------------------------------------------------
# ACCOUNTS (CLIENT 360)
# -------------------------------------------------------------
@router.get(
    "/accounts",
    response_model=List[AccountRead],
    dependencies=[Depends(require_permissions("crm.account.read"))],
)
async def list_accounts(
    search: Optional[str] = None,
    tier: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    context: AuthenticatedUserContext = Depends(require_permissions("crm.account.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Account)
        .options(selectinload(Account.contacts))
        .where(
            Account.organization_id == context.user.organization_id,
            Account.deleted_at.is_(None),
        )
    )

    if tier:
        stmt = stmt.where(Account.tier == tier)
    if search:
        stmt = stmt.where(Account.name.ilike(f"%{search}%"))

    stmt = stmt.order_by(Account.name).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/accounts",
    response_model=AccountRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("crm.account.create"))],
)
async def create_account(
    payload: AccountCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("crm.account.create")),
    db: AsyncSession = Depends(get_db_session),
):
    acc = Account(
        organization_id=context.user.organization_id,
        name=payload.name,
        industry=payload.industry,
        website=payload.website,
        tier=payload.tier,
        status=payload.status,
    )
    db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return acc


@router.get(
    "/accounts/{account_id}/360",
    response_model=Account360Detail,
    dependencies=[Depends(require_permissions("crm.account.read"))],
)
async def get_account_360_view(
    account_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("crm.account.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Account)
        .options(
            selectinload(Account.contacts),
            selectinload(Account.opportunities),
            selectinload(Account.contracts),
        )
        .where(
            Account.id == account_id,
            Account.organization_id == context.user.organization_id,
            Account.deleted_at.is_(None),
        )
    )
    acc = (await db.execute(stmt)).scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    total_deals = len(acc.opportunities)
    active_contracts = [c for c in acc.contracts if c.status == "ACTIVE"]
    pipeline_val = sum(opp.contract_amount for opp in acc.opportunities if opp.stage not in ("CLOSED_LOST",))

    return Account360Detail(
        id=acc.id,
        organization_id=acc.organization_id,
        name=acc.name,
        industry=acc.industry,
        website=acc.website,
        tier=acc.tier,
        status=acc.status,
        total_revenue=acc.total_revenue,
        created_at=acc.created_at,
        contacts=[ContactRead.model_validate(c) for c in acc.contacts],
        total_deals=total_deals,
        active_contracts_count=len(active_contracts),
        pipeline_value=pipeline_val,
    )


# -------------------------------------------------------------
# LEADS & CONVERSION
# -------------------------------------------------------------
@router.get(
    "/leads",
    response_model=List[LeadRead],
    dependencies=[Depends(require_permissions("crm.lead.read"))],
)
async def list_leads(
    status_filter: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    context: AuthenticatedUserContext = Depends(require_permissions("crm.lead.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(Lead).where(
        Lead.organization_id == context.user.organization_id,
        Lead.deleted_at.is_(None),
    )
    if status_filter:
        stmt = stmt.where(Lead.status == status_filter)
    stmt = stmt.order_by(desc(Lead.created_at)).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/leads",
    response_model=LeadRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("crm.lead.create"))],
)
async def create_lead(
    payload: LeadCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("crm.lead.create")),
    db: AsyncSession = Depends(get_db_session),
):
    lead = Lead(
        organization_id=context.user.organization_id,
        title=payload.title,
        contact_name=payload.contact_name,
        email=payload.email,
        phone=payload.phone,
        company=payload.company,
        source=payload.source,
        estimated_value=payload.estimated_value,
        status="NEW",
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.post(
    "/leads/{lead_id}/convert",
    dependencies=[Depends(require_permissions("crm.lead.update"))],
)
async def convert_lead(
    lead_id: uuid.UUID,
    payload: LeadConvertRequest,
    context: AuthenticatedUserContext = Depends(require_permissions("crm.lead.update")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(Lead).where(
        Lead.id == lead_id,
        Lead.organization_id == context.user.organization_id,
        Lead.deleted_at.is_(None),
    )
    lead = (await db.execute(stmt)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.status == "CONVERTED":
        raise HTTPException(status_code=400, detail="Lead has already been converted")

    # 1. Create or link Account
    acc = Account(
        organization_id=context.user.organization_id,
        name=lead.company,
        industry="Technology",
        tier=payload.tier,
        status="PROSPECT",
    )
    db.add(acc)
    await db.flush()

    # 2. Create primary Contact
    name_parts = lead.contact_name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else "Contact"
    contact = Contact(
        account_id=acc.id,
        first_name=first_name,
        last_name=last_name,
        email=lead.email,
        phone=lead.phone,
        is_primary=True,
    )
    db.add(contact)

    # 3. Create initial Opportunity (Deal)
    deal = Opportunity(
        organization_id=context.user.organization_id,
        account_id=acc.id,
        name=payload.deal_name or f"{lead.company} - Initial Project",
        contract_amount=payload.contract_amount or lead.estimated_value,
        stage="DISCOVERY",
        win_probability=30,
        expected_close_date=date.today(),
    )
    db.add(deal)

    # 4. Mark Lead as CONVERTED
    lead.status = "CONVERTED"
    await db.commit()

    return {
        "message": "Lead converted successfully",
        "account_id": acc.id,
        "contact_id": contact.id,
        "opportunity_id": deal.id,
    }


# -------------------------------------------------------------
# OPPORTUNITIES / DEALS
# -------------------------------------------------------------
@router.get(
    "/deals",
    response_model=List[OpportunityRead],
    dependencies=[Depends(require_permissions("crm.deal.read"))],
)
async def list_deals(
    stage: Optional[str] = None,
    context: AuthenticatedUserContext = Depends(require_permissions("crm.deal.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Opportunity, Account.name.label("account_name"))
        .join(Account, Opportunity.account_id == Account.id)
        .where(
            Opportunity.organization_id == context.user.organization_id,
            Opportunity.deleted_at.is_(None),
        )
    )
    if stage:
        stmt = stmt.where(Opportunity.stage == stage)

    stmt = stmt.order_by(desc(Opportunity.contract_amount))
    rows = (await db.execute(stmt)).all()

    return [
        OpportunityRead(
            id=opp.id,
            organization_id=opp.organization_id,
            account_id=opp.account_id,
            name=opp.name,
            stage=opp.stage,
            contract_amount=opp.contract_amount,
            win_probability=opp.win_probability,
            expected_close_date=opp.expected_close_date,
            created_at=opp.created_at,
            account_name=acc_name,
        )
        for opp, acc_name in rows
    ]


@router.post(
    "/deals",
    response_model=OpportunityRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("crm.deal.create"))],
)
async def create_deal(
    payload: OpportunityCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("crm.deal.create")),
    db: AsyncSession = Depends(get_db_session),
):
    acc = (
        await db.execute(
            select(Account).where(
                Account.id == payload.account_id,
                Account.organization_id == context.user.organization_id,
            )
        )
    ).scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    opp = Opportunity(
        organization_id=context.user.organization_id,
        account_id=payload.account_id,
        name=payload.name,
        stage=payload.stage,
        contract_amount=payload.contract_amount,
        win_probability=payload.win_probability,
        expected_close_date=payload.expected_close_date,
    )
    db.add(opp)
    await db.commit()
    await db.refresh(opp)

    return OpportunityRead(
        id=opp.id,
        organization_id=opp.organization_id,
        account_id=opp.account_id,
        name=opp.name,
        stage=opp.stage,
        contract_amount=opp.contract_amount,
        win_probability=opp.win_probability,
        expected_close_date=opp.expected_close_date,
        created_at=opp.created_at,
        account_name=acc.name,
    )


@router.patch(
    "/deals/{deal_id}/stage",
    response_model=OpportunityRead,
    dependencies=[Depends(require_permissions("crm.deal.update"))],
)
async def update_deal_stage(
    deal_id: uuid.UUID,
    payload: OpportunityStageUpdate,
    context: AuthenticatedUserContext = Depends(require_permissions("crm.deal.update")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Opportunity, Account.name)
        .join(Account, Opportunity.account_id == Account.id)
        .where(
            Opportunity.id == deal_id,
            Opportunity.organization_id == context.user.organization_id,
            Opportunity.deleted_at.is_(None),
        )
    )
    row = (await db.execute(stmt)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Deal not found")

    opp, acc_name = row
    opp.stage = payload.stage
    if payload.win_probability is not None:
        opp.win_probability = payload.win_probability
    elif payload.stage == "CLOSED_WON":
        opp.win_probability = 100
    elif payload.stage == "CLOSED_LOST":
        opp.win_probability = 0

    await db.commit()
    await db.refresh(opp)

    return OpportunityRead(
        id=opp.id,
        organization_id=opp.organization_id,
        account_id=opp.account_id,
        name=opp.name,
        stage=opp.stage,
        contract_amount=opp.contract_amount,
        win_probability=opp.win_probability,
        expected_close_date=opp.expected_close_date,
        created_at=opp.created_at,
        account_name=acc_name,
    )


# -------------------------------------------------------------
# PROPOSALS & CONTRACTS
# -------------------------------------------------------------
@router.post(
    "/proposals",
    response_model=ProposalRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("crm.proposal.generate"))],
)
async def create_proposal(
    payload: ProposalCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("crm.proposal.generate")),
    db: AsyncSession = Depends(get_db_session),
):
    opp = (
        await db.execute(
            select(Opportunity).where(
                Opportunity.id == payload.opportunity_id,
                Opportunity.organization_id == context.user.organization_id,
            )
        )
    ).scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    prop = Proposal(
        opportunity_id=payload.opportunity_id,
        proposal_number=payload.proposal_number,
        title=payload.title,
        status="DRAFT",
        total_amount=payload.total_amount,
        valid_until=payload.valid_until,
        scope_of_work=payload.scope_of_work,
    )
    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    return prop


@router.get(
    "/contracts",
    response_model=List[ContractRead],
    dependencies=[Depends(require_permissions("crm.deal.read"))],
)
async def list_contracts(
    context: AuthenticatedUserContext = Depends(require_permissions("crm.deal.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Contract, Account.name.label("account_name"))
        .join(Account, Contract.account_id == Account.id)
        .where(
            Contract.organization_id == context.user.organization_id,
            Contract.deleted_at.is_(None),
        )
        .order_by(desc(Contract.created_at))
    )
    rows = (await db.execute(stmt)).all()

    return [
        ContractRead(
            id=c.id,
            organization_id=c.organization_id,
            account_id=c.account_id,
            proposal_id=c.proposal_id,
            contract_number=c.contract_number,
            title=c.title,
            status=c.status,
            total_value=c.total_value,
            start_date=c.start_date,
            end_date=c.end_date,
            signed_at=c.signed_at,
            signer_name=c.signer_name,
            digital_hash=c.digital_hash,
            created_at=c.created_at,
            account_name=acc_name,
        )
        for c, acc_name in rows
    ]


@router.post(
    "/contracts/{contract_id}/sign",
    response_model=ContractRead,
    dependencies=[Depends(require_permissions("crm.contract.sign"))],
)
async def sign_contract(
    contract_id: uuid.UUID,
    payload: ContractSignRequest,
    context: AuthenticatedUserContext = Depends(require_permissions("crm.contract.sign")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Contract, Account.name)
        .join(Account, Contract.account_id == Account.id)
        .where(
            Contract.id == contract_id,
            Contract.organization_id == context.user.organization_id,
            Contract.deleted_at.is_(None),
        )
    )
    row = (await db.execute(stmt)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Contract not found")

    contract, acc_name = row
    now = datetime.now(timezone.utc)
    sig_payload = f"{contract.id}:{payload.signer_name}:{now.isoformat()}:{contract.total_value}"
    digital_hash = hashlib.sha256(sig_payload.encode()).hexdigest()

    contract.status = "ACTIVE"
    contract.signed_at = now
    contract.signer_name = payload.signer_name
    contract.digital_hash = digital_hash

    # Update account revenue
    account = (
        await db.execute(select(Account).where(Account.id == contract.account_id))
    ).scalar_one()
    account.total_revenue += contract.total_value

    await db.commit()
    await db.refresh(contract)

    return ContractRead(
        id=contract.id,
        organization_id=contract.organization_id,
        account_id=contract.account_id,
        proposal_id=contract.proposal_id,
        contract_number=contract.contract_number,
        title=contract.title,
        status=contract.status,
        total_value=contract.total_value,
        start_date=contract.start_date,
        end_date=contract.end_date,
        signed_at=contract.signed_at,
        signer_name=contract.signer_name,
        digital_hash=contract.digital_hash,
        created_at=contract.created_at,
        account_name=acc_name,
    )
