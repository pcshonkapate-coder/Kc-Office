from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.models.delivery import Project
from app.schemas.finance import (
    InvoiceCreate, InvoiceResponse,
    PaymentCreate, PaymentResponse,
    ExpenseCreate, ExpenseResponse
)
from app.services.finance_service import FinanceService

router = APIRouter()

def get_finance_service(db: Session = Depends(get_db)):
    return FinanceService(db)

def has_global_finance_access(user: User) -> bool:
    for role in user.roles:
        if role.name in ["FINANCE", "HR_ADMIN"]:
            return True
    return False

def check_finance_access(user: User, db: Session, project_id: str = None) -> bool:
    if has_global_finance_access(user):
        return True
        
    # Project managers can view finance for their own projects
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project and project.project_manager_id == user.id:
            return True
            
    return False

@router.get("/metrics")
def get_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: FinanceService = Depends(get_finance_service)
):
    """Get finance aggregate metrics."""
    return service.get_metrics()

# --- Invoices ---

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_all_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: FinanceService = Depends(get_finance_service)
):
    """Get all invoices."""
    return service.get_all_invoices()

@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: FinanceService = Depends(get_finance_service)
):
    """Create a new invoice. Includes uncoupled Tax logic."""
    if not has_global_finance_access(current_user):
        raise HTTPException(status_code=403, detail="Unauthorized to create invoices")
    return service.create_invoice(data)

@router.get("/invoices/project/{project_id}", response_model=List[InvoiceResponse])
def get_project_invoices(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: FinanceService = Depends(get_finance_service)
):
    """Get invoices for a project. Enforces row-level PM access."""
    if not check_finance_access(current_user, db, project_id):
        raise HTTPException(status_code=403, detail="Unauthorized to view these invoices")
    return service.get_project_invoices(project_id)

@router.patch("/invoices/{invoice_id}/status", response_model=InvoiceResponse)
def update_invoice_status(
    invoice_id: str,
    new_status: str = Query(..., description="DRAFT, SENT, OVERDUE, CANCELLED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: FinanceService = Depends(get_finance_service)
):
    """Manually update invoice status (excluding automated payment statuses)."""
    if not has_global_finance_access(current_user):
        raise HTTPException(status_code=403, detail="Unauthorized")
    return service.update_invoice_status(invoice_id, new_status)

# --- Payments ---

@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: FinanceService = Depends(get_finance_service)
):
    """Record a payment. Automatically updates the Invoice status if fully paid."""
    if not has_global_finance_access(current_user):
        raise HTTPException(status_code=403, detail="Unauthorized")
    return service.record_payment(data)

# --- Expenses ---

@router.get("/expenses", response_model=List[ExpenseResponse])
def get_all_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: FinanceService = Depends(get_finance_service)
):
    """Get all expenses."""
    return service.get_all_expenses()

@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def log_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: FinanceService = Depends(get_finance_service)
):
    """Log an internal expense against a project."""
    # Anyone can log an expense for themselves
    return service.log_expense(data, current_user.id)
