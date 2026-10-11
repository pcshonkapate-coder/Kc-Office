from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth import AuthenticatedUserContext, get_current_user_context
from src.core.database import get_db_session
from src.models.crm import Account, Contract, Lead, Opportunity
from src.models.identity import User
from src.models.workforce import Employee
from src.schemas.search import GlobalSearchResponse, SearchResultItem

router = APIRouter(prefix="/search", tags=["Global Search"])


@router.get("", response_model=GlobalSearchResponse)
async def global_search(
    q: str = Query(..., min_length=2, max_length=100),
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    query_pattern = f"%{q}%"
    results: List[SearchResultItem] = []
    org_id = context.user.organization_id

    # 1. Search Accounts
    acc_stmt = select(Account).where(
        Account.organization_id == org_id,
        Account.deleted_at.is_(None),
        (Account.name.ilike(query_pattern)) | (Account.industry.ilike(query_pattern)),
    ).limit(5)
    for acc in (await db.execute(acc_stmt)).scalars():
        results.append(
            SearchResultItem(
                id=acc.id,
                entity_type="ACCOUNT",
                title=acc.name,
                subtitle=f"{acc.industry} • {acc.tier} Tier",
                url=f"/crm?tab=accounts&id={acc.id}",
                metadata={"tier": acc.tier, "revenue": str(acc.total_revenue)},
            )
        )

    # 2. Search Leads
    lead_stmt = select(Lead).where(
        Lead.organization_id == org_id,
        Lead.deleted_at.is_(None),
        (Lead.title.ilike(query_pattern))
        | (Lead.company.ilike(query_pattern))
        | (Lead.contact_name.ilike(query_pattern)),
    ).limit(5)
    for lead in (await db.execute(lead_stmt)).scalars():
        results.append(
            SearchResultItem(
                id=lead.id,
                entity_type="LEAD",
                title=lead.title,
                subtitle=f"{lead.company} • {lead.contact_name} ({lead.status})",
                url=f"/crm?tab=leads&id={lead.id}",
                metadata={"status": lead.status, "value": str(lead.estimated_value)},
            )
        )

    # 3. Search Opportunities (Deals)
    deal_stmt = select(Opportunity).where(
        Opportunity.organization_id == org_id,
        Opportunity.deleted_at.is_(None),
        Opportunity.name.ilike(query_pattern),
    ).limit(5)
    for deal in (await db.execute(deal_stmt)).scalars():
        results.append(
            SearchResultItem(
                id=deal.id,
                entity_type="DEAL",
                title=deal.name,
                subtitle=f"Stage: {deal.stage} • Amount: ₹{deal.contract_amount}",
                url=f"/crm?tab=deals&id={deal.id}",
                metadata={"stage": deal.stage, "amount": str(deal.contract_amount)},
            )
        )

    # 4. Search Employees
    emp_stmt = (
        select(Employee, User.full_name, User.email)
        .join(User, Employee.user_id == User.id)
        .where(
            Employee.organization_id == org_id,
            Employee.deleted_at.is_(None),
            (User.full_name.ilike(query_pattern))
            | (Employee.employee_code.ilike(query_pattern))
            | (Employee.job_title.ilike(query_pattern)),
        )
        .limit(5)
    )
    for emp, full_name, email in (await db.execute(emp_stmt)).all():
        results.append(
            SearchResultItem(
                id=emp.id,
                entity_type="EMPLOYEE",
                title=full_name,
                subtitle=f"{emp.job_title} ({emp.employee_code})",
                url=f"/people?tab=directory&id={emp.id}",
                metadata={"job_title": emp.job_title, "email": email},
            )
        )

    # 5. Search Contracts
    contract_stmt = select(Contract).where(
        Contract.organization_id == org_id,
        Contract.deleted_at.is_(None),
        (Contract.title.ilike(query_pattern)) | (Contract.contract_number.ilike(query_pattern)),
    ).limit(5)
    for c in (await db.execute(contract_stmt)).scalars():
        results.append(
            SearchResultItem(
                id=c.id,
                entity_type="CONTRACT",
                title=c.title,
                subtitle=f"{c.contract_number} • Status: {c.status}",
                url=f"/crm?tab=contracts&id={c.id}",
                metadata={"status": c.status, "value": str(c.total_value)},
            )
        )

    return GlobalSearchResponse(
        query=q,
        total_matches=len(results),
        results=results,
    )
