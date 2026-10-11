from datetime import date, datetime, timezone
from decimal import Decimal
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
from src.models.crm import Account
from src.models.finance import Expense, Invoice, InvoiceItem, Payment
from src.models.identity import User
from src.models.projects import Project, TimeEntry
from src.models.workforce import Employee
from src.schemas.finance import (
    ExpenseCreate,
    ExpenseRead,
    ExpenseStatusUpdate,
    InvoiceCreate,
    InvoiceItemRead,
    InvoiceRead,
    PaymentCreate,
    PaymentRead,
    ProjectProfitabilityRead,
)

router = APIRouter(prefix="/finance", tags=["Finance & Billing"])


# -------------------------------------------------------------
# INVOICE ENGINE (GST & STRICT IMMUTABILITY)
# -------------------------------------------------------------
@router.get(
    "/invoices",
    response_model=List[InvoiceRead],
    dependencies=[Depends(require_permissions("finance.invoice.read"))],
)
async def list_invoices(
    status_filter: Optional[str] = None,
    context: AuthenticatedUserContext = Depends(require_permissions("finance.invoice.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Invoice, Account.name.label("account_name"))
        .join(Account, Invoice.account_id == Account.id)
        .options(selectinload(Invoice.items))
        .where(
            Invoice.organization_id == context.user.organization_id,
            Invoice.deleted_at.is_(None),
        )
    )
    if status_filter:
        stmt = stmt.where(Invoice.status == status_filter)

    stmt = stmt.order_by(desc(Invoice.issue_date))
    rows = (await db.execute(stmt)).all()

    return [
        InvoiceRead(
            id=inv.id,
            organization_id=inv.organization_id,
            project_id=inv.project_id,
            account_id=inv.account_id,
            invoice_number=inv.invoice_number,
            issue_date=inv.issue_date,
            due_date=inv.due_date,
            subtotal=inv.subtotal,
            tax_type=inv.tax_type,
            cgst_rate=inv.cgst_rate,
            cgst_amount=inv.cgst_amount,
            sgst_rate=inv.sgst_rate,
            sgst_amount=inv.sgst_amount,
            igst_rate=inv.igst_rate,
            igst_amount=inv.igst_amount,
            total_tax=inv.total_tax,
            total_amount=inv.total_amount,
            amount_paid=inv.amount_paid,
            status=inv.status,
            notes=inv.notes,
            created_at=inv.created_at,
            account_name=acc_name,
            items=[InvoiceItemRead.model_validate(item) for item in inv.items],
        )
        for inv, acc_name in rows
    ]


@router.post(
    "/invoices",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("finance.invoice.create"))],
)
async def create_invoice(
    payload: InvoiceCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("finance.invoice.create")),
    db: AsyncSession = Depends(get_db_session),
):
    # Verify account
    acc = (
        await db.execute(
            select(Account).where(
                Account.id == payload.account_id,
                Account.organization_id == context.user.organization_id,
            )
        )
    ).scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Client Account not found")

    # 1. Compute Subtotal from line items
    subtotal = Decimal("0.00")
    items_to_create = []
    for item_data in payload.items:
        line_total = item_data.unit_price * Decimal(item_data.quantity)
        subtotal += line_total
        items_to_create.append((item_data.description, item_data.quantity, item_data.unit_price, line_total))

    # 2. Compute Indian GST logic
    cgst_rate = Decimal("9.00")
    sgst_rate = Decimal("9.00")
    igst_rate = Decimal("18.00")

    if payload.tax_type == "INTRA_STATE":
        cgst_amount = (subtotal * cgst_rate) / Decimal("100.00")
        sgst_amount = (subtotal * sgst_rate) / Decimal("100.00")
        igst_amount = Decimal("0.00")
        total_tax = cgst_amount + sgst_amount
    elif payload.tax_type == "INTER_STATE":
        cgst_amount = Decimal("0.00")
        sgst_amount = Decimal("0.00")
        igst_amount = (subtotal * igst_rate) / Decimal("100.00")
        total_tax = igst_amount
    else:  # EXEMPT
        cgst_amount = Decimal("0.00")
        sgst_amount = Decimal("0.00")
        igst_amount = Decimal("0.00")
        total_tax = Decimal("0.00")

    total_amount = subtotal + total_tax

    # 3. Create Invoice
    invoice = Invoice(
        organization_id=context.user.organization_id,
        account_id=payload.account_id,
        project_id=payload.project_id,
        invoice_number=payload.invoice_number.upper(),
        issue_date=payload.issue_date,
        due_date=payload.due_date,
        subtotal=subtotal,
        tax_type=payload.tax_type,
        cgst_rate=cgst_rate,
        cgst_amount=cgst_amount,
        sgst_rate=sgst_rate,
        sgst_amount=sgst_amount,
        igst_rate=igst_rate,
        igst_amount=igst_amount,
        total_tax=total_tax,
        total_amount=total_amount,
        amount_paid=Decimal("0.00"),
        status="DRAFT",
        notes=payload.notes,
    )
    db.add(invoice)
    await db.flush()

    for desc_text, qty, price, total in items_to_create:
        line_item = InvoiceItem(
            invoice_id=invoice.id,
            description=desc_text,
            quantity=qty,
            unit_price=price,
            line_total=total,
        )
        db.add(line_item)

    await db.commit()
    await db.refresh(invoice)

    return InvoiceRead(
        id=invoice.id,
        organization_id=invoice.organization_id,
        project_id=invoice.project_id,
        account_id=invoice.account_id,
        invoice_number=invoice.invoice_number,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        subtotal=invoice.subtotal,
        tax_type=invoice.tax_type,
        cgst_rate=invoice.cgst_rate,
        cgst_amount=invoice.cgst_amount,
        sgst_rate=invoice.sgst_rate,
        sgst_amount=invoice.sgst_amount,
        igst_rate=invoice.igst_rate,
        igst_amount=invoice.igst_amount,
        total_tax=invoice.total_tax,
        total_amount=invoice.total_amount,
        amount_paid=invoice.amount_paid,
        status=invoice.status,
        notes=invoice.notes,
        created_at=invoice.created_at,
        account_name=acc.name,
    )


@router.delete("/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("finance.invoice.approve")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(Invoice).where(
        Invoice.id == invoice_id,
        Invoice.organization_id == context.user.organization_id,
    )
    invoice = (await db.execute(stmt)).scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # STRICT IMMUTABILITY CHECK
    if invoice.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paid invoices are strictly immutable and cannot be deleted from the financial audit trail.",
        )

    invoice.deleted_at = datetime.now(timezone.utc)
    invoice.status = "CANCELLED"
    await db.commit()
    return {"message": "Invoice cancelled successfully"}


# -------------------------------------------------------------
# PAYMENTS RECEIVED
# -------------------------------------------------------------
@router.post(
    "/payments",
    response_model=PaymentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("finance.payment.record"))],
)
async def record_payment(
    payload: PaymentCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("finance.payment.record")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(Invoice).where(
        Invoice.id == payload.invoice_id,
        Invoice.organization_id == context.user.organization_id,
    )
    invoice = (await db.execute(stmt)).scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payment = Payment(
        organization_id=context.user.organization_id,
        invoice_id=payload.invoice_id,
        amount_paid=payload.amount_paid,
        payment_date=payload.payment_date,
        payment_method=payload.payment_method,
        transaction_reference=payload.transaction_reference,
        notes=payload.notes,
    )
    db.add(payment)

    # Update invoice paid balance & shift status
    invoice.amount_paid += payload.amount_paid
    if invoice.amount_paid >= invoice.total_amount:
        invoice.status = "PAID"
    elif invoice.amount_paid > Decimal("0.00"):
        invoice.status = "PARTIALLY_PAID"

    await db.commit()
    await db.refresh(payment)
    return payment


# -------------------------------------------------------------
# EXPENSES MANAGEMENT
# -------------------------------------------------------------
@router.get(
    "/expenses",
    response_model=List[ExpenseRead],
    dependencies=[Depends(require_permissions("finance.margin.view"))],
)
async def list_expenses(
    context: AuthenticatedUserContext = Depends(require_permissions("finance.margin.view")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Expense, User.full_name.label("employee_name"), Project.name.label("project_name"))
        .join(Employee, Expense.employee_id == Employee.id)
        .join(User, Employee.user_id == User.id)
        .outerjoin(Project, Expense.project_id == Project.id)
        .where(
            Expense.organization_id == context.user.organization_id,
            Expense.deleted_at.is_(None),
        )
        .order_by(desc(Expense.expense_date))
    )
    rows = (await db.execute(stmt)).all()
    return [
        ExpenseRead(
            id=e.id,
            organization_id=e.organization_id,
            employee_id=e.employee_id,
            project_id=e.project_id,
            title=e.title,
            category=e.category,
            amount=e.amount,
            expense_date=e.expense_date,
            receipt_url=e.receipt_url,
            status=e.status,
            decision_notes=e.decision_notes,
            created_at=e.created_at,
            employee_name=u_name,
            project_name=p_name,
        )
        for e, u_name, p_name in rows
    ]


@router.post("/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def submit_expense(
    payload: ExpenseCreate,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    emp = (
        await db.execute(select(Employee).where(Employee.user_id == context.user.id))
    ).scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=400, detail="User must have an active employee profile to file expenses")

    expense = Expense(
        organization_id=context.user.organization_id,
        employee_id=emp.id,
        project_id=payload.project_id,
        title=payload.title,
        category=payload.category,
        amount=payload.amount,
        expense_date=payload.expense_date,
        receipt_url=payload.receipt_url,
        status="SUBMITTED",
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)

    return ExpenseRead(
        id=expense.id,
        organization_id=expense.organization_id,
        employee_id=expense.employee_id,
        project_id=expense.project_id,
        title=expense.title,
        category=expense.category,
        amount=expense.amount,
        expense_date=expense.expense_date,
        receipt_url=expense.receipt_url,
        status=expense.status,
        decision_notes=expense.decision_notes,
        created_at=expense.created_at,
        employee_name=context.user.full_name,
    )


# -------------------------------------------------------------
# PROJECT PROFITABILITY & BUDGET CONTROL ALERTS
# -------------------------------------------------------------
@router.get(
    "/projects/{project_id}/profitability",
    response_model=ProjectProfitabilityRead,
    dependencies=[Depends(require_permissions("finance.margin.view"))],
)
async def get_project_profitability(
    project_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("finance.margin.view")),
    db: AsyncSession = Depends(get_db_session),
):
    proj_stmt = select(Project).where(
        Project.id == project_id,
        Project.organization_id == context.user.organization_id,
    )
    project = (await db.execute(proj_stmt)).scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. Billed/Paid Revenue
    inv_stmt = select(Invoice).where(
        Invoice.project_id == project_id,
        Invoice.status.in_(["SENT", "PARTIALLY_PAID", "PAID"]),
    )
    invoices = (await db.execute(inv_stmt)).scalars().all()
    billed_revenue = sum(inv.total_amount for inv in invoices)

    # 2. Labor Cost = TimeEntries * Employee hourly_cost_rate
    te_stmt = (
        select(TimeEntry, Employee.hourly_cost_rate)
        .join(Employee, TimeEntry.user_id == Employee.user_id)
        .join(Project, Project.id == project_id)
        .where(TimeEntry.is_running.is_(False))
    )
    time_rows = (await db.execute(te_stmt)).all()
    labor_cost = Decimal("0.00")
    for te, hourly_rate in time_rows:
        hours = Decimal(te.duration_seconds) / Decimal("3600.00")
        labor_cost += hours * hourly_rate

    # 3. Approved Expenses
    exp_stmt = select(Expense).where(
        Expense.project_id == project_id,
        Expense.status.in_(["APPROVED", "REIMBURSED"]),
    )
    expenses_list = (await db.execute(exp_stmt)).scalars().all()
    total_expenses = sum(e.amount for e in expenses_list)

    # 4. Profit & Margins
    gross_profit = billed_revenue - labor_cost - total_expenses
    margin_percentage = Decimal("0.00")
    if billed_revenue > Decimal("0.00"):
        margin_percentage = (gross_profit / billed_revenue) * Decimal("100.00")

    # 5. Budget Consumption & Threshold Alerts
    total_consumed = labor_cost + total_expenses
    budget_consumed_pct = Decimal("0.00")
    if project.total_budget > Decimal("0.00"):
        budget_consumed_pct = (total_consumed / project.total_budget) * Decimal("100.00")

    alert_level = "NORMAL"
    if budget_consumed_pct >= Decimal("100.00"):
        alert_level = "CRITICAL"
    elif budget_consumed_pct >= Decimal("85.00"):
        alert_level = "HIGH"
    elif budget_consumed_pct >= Decimal("70.00"):
        alert_level = "WARNING"

    return ProjectProfitabilityRead(
        project_id=project.id,
        project_code=project.project_code,
        project_name=project.name,
        total_budget=project.total_budget,
        billed_revenue=billed_revenue,
        labor_cost=labor_cost,
        expenses=total_expenses,
        gross_profit=gross_profit,
        margin_percentage=margin_percentage,
        budget_consumed_percentage=budget_consumed_pct,
        budget_alert_level=alert_level,
    )
