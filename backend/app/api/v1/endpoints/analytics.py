from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.models.delivery import Project
from app.schemas.analytics import ProjectProfitabilityDashboard
from app.services.analytics_service import AnalyticsService

router = APIRouter()

def get_analytics_service(db: Session = Depends(get_db)):
    return AnalyticsService(db)

def has_global_finance_access(user: User) -> bool:
    for role in user.roles:
        if role.name in ["FINANCE", "HR_ADMIN"]:
            return True
    return False

def check_analytics_access(user: User, db: Session, project_id: str) -> bool:
    if has_global_finance_access(user):
        return True
        
    project = db.query(Project).filter(Project.id == project_id).first()
    if project and project.project_manager_id == user.id:
        return True
            
    return False


@router.get("/project/{project_id}/profitability", response_model=ProjectProfitabilityDashboard)
def get_project_profitability(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Returns the real-time financial profitability dashboard for a given project.
    Aggregates multi-currency invoices, payments, timesheets, and expenses.
    """
    if not check_analytics_access(current_user, db, project_id):
        raise HTTPException(status_code=403, detail="Unauthorized to view project financial analytics.")
        
    return service.get_project_profitability(project_id)
