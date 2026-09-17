from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.services.executive_analytics import ExecutiveAnalyticsService
from app.schemas.executive_analytics import (
    CEODashboardResponse, SalesAnalyticsResponse,
    ProjectAnalyticsResponse, TeamAnalyticsResponse, FinanceAnalyticsResponse
)

router = APIRouter()

def get_analytics_service(db: Session = Depends(get_db)):
    return ExecutiveAnalyticsService(db)

class AnalyticsFilter:
    def __init__(
        self,
        start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
        end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
        company_id: Optional[str] = None,
        project_id: Optional[str] = None,
        department: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        self.start_date = start_date
        self.end_date = end_date
        self.company_id = company_id
        self.project_id = project_id
        self.department = department
        self.user_id = user_id

def verify_role(current_user: User, allowed_roles: list[str]):
    user_roles = [role.name for role in current_user.roles]
    if "ADMIN" in user_roles or "CEO" in user_roles:
        return True
    for role in allowed_roles:
        if role in user_roles:
            return True
    raise HTTPException(status_code=403, detail="Not authorized to view this analytics dashboard.")

@router.get("/ceo", response_model=CEODashboardResponse)
def get_ceo_dashboard(
    filters: AnalyticsFilter = Depends(),
    service: ExecutiveAnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_active_user)
):
    verify_role(current_user, ["CEO"])
    return service.get_ceo_dashboard(vars(filters))

@router.get("/sales", response_model=SalesAnalyticsResponse)
def get_sales_analytics(
    filters: AnalyticsFilter = Depends(),
    service: ExecutiveAnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_active_user)
):
    verify_role(current_user, ["SALES_MANAGER"])
    return service.get_sales_analytics(vars(filters))

@router.get("/projects", response_model=ProjectAnalyticsResponse)
def get_project_analytics(
    filters: AnalyticsFilter = Depends(),
    service: ExecutiveAnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_active_user)
):
    verify_role(current_user, ["PROJECT_MANAGER"])
    return service.get_project_analytics(vars(filters))

@router.get("/team", response_model=TeamAnalyticsResponse)
def get_team_analytics(
    filters: AnalyticsFilter = Depends(),
    service: ExecutiveAnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_active_user)
):
    verify_role(current_user, ["HR", "PROJECT_MANAGER"])
    return service.get_team_analytics(vars(filters))

@router.get("/finance", response_model=FinanceAnalyticsResponse)
def get_finance_analytics(
    filters: AnalyticsFilter = Depends(),
    service: ExecutiveAnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_active_user)
):
    verify_role(current_user, ["FINANCE"])
    return service.get_finance_analytics(vars(filters))
