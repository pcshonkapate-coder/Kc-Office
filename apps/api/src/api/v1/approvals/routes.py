from datetime import datetime, timezone
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth import (
    AuthenticatedUserContext,
    get_current_user_context,
)
from src.core.database import get_db_session
from src.models.crm import Account
from src.models.finance import Expense, Invoice
from src.models.identity import User
from src.models.projects import Milestone, Project
from src.models.workforce import Employee, LeaveRequest

router = APIRouter(prefix="/approvals", tags=["Universal Approval Center"])


class ApprovalItemRead(BaseModel):
    id: uuid.UUID
    entity_type: str  # "EXPENSE", "LEAVE", "INVOICE", "MILESTONE"
    title: str
    submitter_name: str
    amount_or_duration: str
    requested_at: datetime
    status: str
    details: Optional[str] = None


class ApprovalActionRequest(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    decision_notes: Optional[str] = None


@router.get("", response_model=List[ApprovalItemRead])
async def list_pending_approvals(
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    results: List[ApprovalItemRead] = []
    org_id = context.user.organization_id

    # 1. Pending Expenses
    exp_stmt = (
        select(Expense, User.full_name)
        .join(Employee, Expense.employee_id == Employee.id)
        .join(User, Employee.user_id == User.id)
        .where(Expense.organization_id == org_id, Expense.status == "SUBMITTED")
        .order_by(desc(Expense.created_at))
    )
    for exp, emp_name in (await db.execute(exp_stmt)).all():
        results.append(
            ApprovalItemRead(
                id=exp.id,
                entity_type="EXPENSE",
                title=f"Expense: {exp.title} ({exp.category})",
                submitter_name=emp_name,
                amount_or_duration=f"₹{exp.amount}",
                requested_at=exp.created_at,
                status=exp.status,
                details=f"Category: {exp.category}",
            )
        )

    # 2. Pending Leaves
    leave_stmt = (
        select(LeaveRequest, User.full_name)
        .join(Employee, LeaveRequest.employee_id == Employee.id)
        .join(User, Employee.user_id == User.id)
        .where(Employee.organization_id == org_id, LeaveRequest.status == "PENDING")
        .order_by(desc(LeaveRequest.created_at))
    )
    for l, emp_name in (await db.execute(leave_stmt)).all():
        results.append(
            ApprovalItemRead(
                id=l.id,
                entity_type="LEAVE",
                title=f"Leave Request ({l.leave_type})",
                submitter_name=emp_name,
                amount_or_duration=f"{l.total_days} days ({l.start_date} to {l.end_date})",
                requested_at=l.created_at,
                status=l.status,
                details=l.reason,
            )
        )

    # 3. Pending Invoices (Draft awaiting sendout)
    inv_stmt = (
        select(Invoice, Account.name)
        .join(Account, Invoice.account_id == Account.id)
        .where(Invoice.organization_id == org_id, Invoice.status == "DRAFT")
        .order_by(desc(Invoice.created_at))
    )
    for inv, acc_name in (await db.execute(inv_stmt)).all():
        results.append(
            ApprovalItemRead(
                id=inv.id,
                entity_type="INVOICE",
                title=f"Invoice Review: {inv.invoice_number}",
                submitter_name=acc_name,
                amount_or_duration=f"₹{inv.total_amount}",
                requested_at=inv.created_at,
                status=inv.status,
                details=f"Due: {inv.due_date}",
            )
        )

    # 4. Reached Milestones awaiting verification
    m_stmt = (
        select(Milestone, Project.name)
        .join(Project, Milestone.project_id == Project.id)
        .where(Project.organization_id == org_id, Milestone.status == "REACHED")
        .order_by(desc(Milestone.created_at))
    )
    for m, proj_name in (await db.execute(m_stmt)).all():
        results.append(
            ApprovalItemRead(
                id=m.id,
                entity_type="MILESTONE",
                title=f"Milestone Verification: {m.title}",
                submitter_name=proj_name,
                amount_or_duration=f"{m.billing_percentage}% billing release",
                requested_at=m.created_at,
                status=m.status,
                details=f"Target: {m.due_date}",
            )
        )

    return sorted(results, key=lambda x: x.requested_at, reverse=True)


@router.post("/{entity_type}/{item_id}/action")
async def process_approval_action(
    entity_type: str,
    item_id: uuid.UUID,
    payload: ApprovalActionRequest,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    action = payload.action.upper()
    if action not in ("APPROVE", "REJECT"):
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT")

    if entity_type == "EXPENSE":
        exp = (
            await db.execute(
                select(Expense).where(
                    Expense.id == item_id,
                    Expense.organization_id == context.user.organization_id,
                )
            )
        ).scalar_one_or_none()
        if not exp:
            raise HTTPException(status_code=404, detail="Expense not found")
        exp.status = "APPROVED" if action == "APPROVE" else "REJECTED"
        exp.approver_id = context.user.id
        exp.decision_notes = payload.decision_notes

    elif entity_type == "LEAVE":
        leave = (
            await db.execute(
                select(LeaveRequest)
                .join(Employee, LeaveRequest.employee_id == Employee.id)
                .where(
                    LeaveRequest.id == item_id,
                    Employee.organization_id == context.user.organization_id,
                )
            )
        ).scalar_one_or_none()
        if not leave:
            raise HTTPException(status_code=404, detail="Leave request not found")
        leave.status = "APPROVED" if action == "APPROVE" else "REJECTED"
        leave.approver_id = context.user.id
        leave.decision_notes = payload.decision_notes

    elif entity_type == "INVOICE":
        inv = (
            await db.execute(
                select(Invoice).where(
                    Invoice.id == item_id,
                    Invoice.organization_id == context.user.organization_id,
                )
            )
        ).scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")
        inv.status = "SENT" if action == "APPROVE" else "CANCELLED"

    elif entity_type == "MILESTONE":
        m = (await db.execute(select(Milestone).where(Milestone.id == item_id))).scalar_one_or_none()
        if not m:
            raise HTTPException(status_code=404, detail="Milestone not found")
        m.status = "INVOICED" if action == "APPROVE" else "IN_PROGRESS"

    else:
        raise HTTPException(status_code=400, detail="Invalid approval entity type")

    await db.commit()
    return {"message": f"{entity_type} {action.lower()}d successfully", "item_id": str(item_id)}
