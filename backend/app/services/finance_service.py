from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.finance import Invoice, InvoiceItem, Payment, Expense
from app.models.auth import User
from app.schemas.finance import (
    InvoiceCreate, InvoiceResponse,
    PaymentCreate, PaymentResponse,
    ExpenseCreate, ExpenseResponse
)
from app.services.currency_service import CurrencyService
from app.core.exceptions import KapateAppException

class FinanceService:
    def __init__(self, db: Session):
        self.db = db
        self.currency_service = CurrencyService()

    # --- Invoices ---
    def create_invoice(self, data: InvoiceCreate) -> InvoiceResponse:
        # Note: Tax calculation is intentionally uncoupled. We trust the DTO values.
        
        invoice = Invoice(
            company_id=data.company_id,
            project_id=data.project_id,
            deal_id=data.deal_id,
            invoice_number=data.invoice_number,
            invoice_date=data.invoice_date,
            due_date=data.due_date,
            subtotal=data.subtotal,
            discount=data.discount,
            tax_rate=data.tax_rate,
            tax_amount=data.tax_amount,
            total_amount=data.total_amount,
            currency=data.currency,
            gstin=data.gstin,
            cgst=data.cgst,
            sgst=data.sgst,
            igst=data.igst,
            place_of_supply=data.place_of_supply,
            is_export=data.is_export,
            payment_terms=data.payment_terms,
            status="DRAFT"
        )
        self.db.add(invoice)
        self.db.flush()
        
        for item in data.items:
            db_item = InvoiceItem(
                **item.model_dump(),
                invoice_id=invoice.id
            )
            self.db.add(db_item)
            
        self.db.commit()
        self.db.refresh(invoice)
        return InvoiceResponse.model_validate(invoice)
        
    def update_invoice_status(self, invoice_id: str, new_status: str) -> InvoiceResponse:
        inv = self.db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not inv:
            raise KapateAppException(status_code=404, detail="Invoice not found")
            
        inv.status = new_status
        self.db.commit()
        self.db.refresh(inv)
        return InvoiceResponse.model_validate(inv)

    def get_project_invoices(self, project_id: str) -> List[InvoiceResponse]:
        invoices = self.db.query(Invoice).filter(Invoice.project_id == project_id).all()
        return [InvoiceResponse.model_validate(i) for i in invoices]

    def get_all_invoices(self) -> List[InvoiceResponse]:
        invoices = self.db.query(Invoice).all()
        return [InvoiceResponse.model_validate(i) for i in invoices]

    # --- Payments ---
    def record_payment(self, data: PaymentCreate) -> PaymentResponse:
        inv = self.db.query(Invoice).filter(Invoice.id == data.invoice_id).first()
        if not inv:
            raise KapateAppException(status_code=404, detail="Invoice not found")
            
        pmt = Payment(
            **data.model_dump(),
            status="completed"
        )
        self.db.add(pmt)
        
        # Check if fully paid
        current_payments = self.db.query(func.sum(Payment.amount)).filter(Payment.invoice_id == inv.id).scalar() or 0.0
        total_paid = float(current_payments) + float(data.amount)
        
        # Note: A real app would do currency conversion here if the payment currency != invoice currency
        if total_paid >= float(inv.total_amount):
            inv.status = "PAID"
        elif total_paid > 0:
            inv.status = "PARTIALLY PAID"
            
        self.db.commit()
        self.db.refresh(pmt)
        return PaymentResponse.model_validate(pmt)

    # --- Expenses ---
    def log_expense(self, data: ExpenseCreate, user_id: str) -> ExpenseResponse:
        dump = data.model_dump()
        if not dump.get("date"):
            dump["date"] = date.today()
        exp = Expense(
            **dump,
            user_id=user_id,
            status="submitted"
        )
        self.db.add(exp)
        self.db.commit()
        self.db.refresh(exp)
        return ExpenseResponse.model_validate(exp)

    def get_all_expenses(self) -> List[ExpenseResponse]:
        expenses = self.db.query(Expense).all()
        for e in expenses:
            if e.date is None:
                e.date = date.today()
        return [ExpenseResponse.model_validate(e) for e in expenses]

    def get_metrics(self) -> dict:
        total_revenue_paid = self.db.query(func.sum(Payment.amount)).scalar() or 0.0
        total_receivable_sent = self.db.query(func.sum(Invoice.total_amount)).filter(Invoice.status == "SENT").scalar() or 0.0
        total_overdue = self.db.query(func.sum(Invoice.total_amount)).filter(Invoice.status == "OVERDUE").scalar() or 0.0
        total_expenses_approved = self.db.query(func.sum(Expense.amount)).scalar() or 0.0

        return {
            "total_revenue_paid": float(total_revenue_paid),
            "total_receivable_sent": float(total_receivable_sent),
            "total_overdue": float(total_overdue),
            "total_expenses_approved": float(total_expenses_approved),
        }
