from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from app.models.finance import Invoice, InvoiceItem, Payment, Expense
from app.models.delivery import Project
from app.models.crm import Company
from app.models.auth import User


class FinanceRepository:
    def __init__(self, db: Session):
        self.db = db

    # ==================== INVOICES ====================
    def get_invoices(
        self,
        status: Optional[str] = None,
        company_id: Optional[str] = None,
        project_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Invoice]:
        query = self.db.query(Invoice).options(
            joinedload(Invoice.company),
            joinedload(Invoice.project),
            joinedload(Invoice.items),
            joinedload(Invoice.payments),
        ).filter(Invoice.is_deleted.is_(False))

        if status and status != "all":
            query = query.filter(Invoice.status == status)
        if company_id:
            query = query.filter(Invoice.company_id == company_id)
        if project_id:
            query = query.filter(Invoice.project_id == project_id)
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(func.lower(Invoice.invoice_number).like(s))

        return query.order_by(Invoice.invoice_date.desc()).all()

    def get_invoice_by_id(self, invoice_id: str) -> Optional[Invoice]:
        return self.db.query(Invoice).options(
            joinedload(Invoice.company),
            joinedload(Invoice.project),
            joinedload(Invoice.items),
            joinedload(Invoice.payments),
        ).filter(Invoice.id == invoice_id, Invoice.is_deleted.is_(False)).first()

    def get_invoice_by_number(self, inv_number: str) -> Optional[Invoice]:
        return self.db.query(Invoice).filter(Invoice.invoice_number == inv_number, Invoice.is_deleted.is_(False)).first()

    def create_invoice(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def update_invoice(self, invoice: Invoice, data: dict) -> Invoice:
        for k, v in data.items():
            if v is not None:
                setattr(invoice, k, v)
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    # ==================== PAYMENTS ====================
    def create_payment(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    # ==================== EXPENSES ====================
    def get_expenses(
        self,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        category: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> List[Expense]:
        query = self.db.query(Expense).options(
            joinedload(Expense.project),
            joinedload(Expense.user),
        )
        if project_id:
            query = query.filter(Expense.project_id == project_id)
        if status and status != "all":
            query = query.filter(Expense.status == status)
        if category:
            query = query.filter(Expense.expense_category == category)
        if user_id:
            query = query.filter(Expense.user_id == user_id)

        return query.order_by(Expense.created_at.desc()).all()

    def get_expense_by_id(self, expense_id: str) -> Optional[Expense]:
        return self.db.query(Expense).options(
            joinedload(Expense.project),
            joinedload(Expense.user),
        ).filter(Expense.id == expense_id).first()

    def create_expense(self, expense: Expense) -> Expense:
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def update_expense(self, expense: Expense, data: dict) -> Expense:
        for k, v in data.items():
            if v is not None:
                setattr(expense, k, v)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    # ==================== METRICS ====================
    def get_metrics(self) -> Dict[str, Any]:
        paid_revenue = self.db.query(func.sum(Invoice.total_amount)).filter(Invoice.status == "paid", Invoice.is_deleted.is_(False)).scalar() or Decimal("0.00")
        sent_receivable = self.db.query(func.sum(Invoice.total_amount)).filter(Invoice.status == "sent", Invoice.is_deleted.is_(False)).scalar() or Decimal("0.00")
        overdue_amt = self.db.query(func.sum(Invoice.total_amount)).filter(Invoice.status == "overdue", Invoice.is_deleted.is_(False)).scalar() or Decimal("0.00")
        approved_exp = self.db.query(func.sum(Expense.amount)).filter(Expense.status.in_(["approved", "reimbursed"])).scalar() or Decimal("0.00")

        gross_margin = Decimal("0.00")
        if paid_revenue > 0:
            gross_margin = ((paid_revenue - approved_exp) / paid_revenue * 100).quantize(Decimal("0.01"))

        return {
            "total_revenue_paid": paid_revenue,
            "total_receivable_sent": sent_receivable,
            "total_overdue": overdue_amt,
            "total_expenses_approved": approved_exp,
            "gross_margin_percentage": gross_margin,
            "currency": "INR",
        }
