from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.schemas.client import (
    ClientDashboardResponse, ClientProjectResponse, ClientInvoiceResponse
)
from app.services.client_service import ClientService

router = APIRouter()

def verify_client_access(current_user: User = Depends(get_current_active_user)) -> User:
    """Dependency that guarantees the user has the CLIENT role."""
    is_client = any(role.name == "CLIENT" for role in current_user.roles)
    if not is_client:
        raise HTTPException(status_code=403, detail="Access forbidden. Endpoint restricted to clients only.")
    return current_user

def get_client_service(
    db: Session = Depends(get_db), 
    user: User = Depends(verify_client_access)
) -> ClientService:
    """Dependency that initializes the isolated ClientService with the authenticated user."""
    return ClientService(db, user)

@router.get("/dashboard", response_model=ClientDashboardResponse)
def get_dashboard(service: ClientService = Depends(get_client_service)):
    """Returns the high-level dashboard data for the client's company."""
    return service.get_dashboard()

@router.get("/projects", response_model=List[ClientProjectResponse])
def get_projects(service: ClientService = Depends(get_client_service)):
    """Returns all projects attached to the client's company, filtering out hidden milestones/tasks."""
    return service.get_projects()

@router.get("/invoices", response_model=List[ClientInvoiceResponse])
def get_invoices(service: ClientService = Depends(get_client_service)):
    """Returns all sent/paid invoices attached to the client's company."""
    return service.get_invoices()
