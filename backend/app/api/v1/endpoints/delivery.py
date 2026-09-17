from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.schemas.delivery import (
    ProjectResponse, TaskCreate, TaskResponse, 
    KanbanMoveRequest, DeliveryCommentCreate, DeliveryCommentResponse
)
from app.services.delivery_service import DeliveryService

router = APIRouter()

def get_delivery_service(db: Session = Depends(get_db)):
    return DeliveryService(db)

@router.post("/projects/from-deal/{deal_id}", response_model=ProjectResponse)
def convert_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Convert a Closed Won Deal into a Project."""
    return service.convert_deal_to_project(deal_id, current_user.id)

@router.post("/tasks", response_model=TaskResponse)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Create a new task."""
    return service.create_task(data, requesting_user=current_user)

@router.patch("/tasks/{task_id}/move", response_model=TaskResponse)
def move_task_kanban(
    task_id: str,
    payload: KanbanMoveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Kanban drag and drop status/order update."""
    return service.move_task_kanban(task_id, payload)

@router.post("/comments", response_model=DeliveryCommentResponse)
def add_comment(
    payload: DeliveryCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Add a comment with @mention parsing and client_visible controls."""
    return service.add_comment(payload, current_user.id)

@router.get("/projects")
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DeliveryService = Depends(get_delivery_service)
):
    """List all projects."""
    return service.get_projects()

@router.get("/projects/{project_id}")
def get_project_detail(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Get detailed project view."""
    return service.get_project_detail(project_id)

@router.get("/tasks")
def list_tasks(
    assigned_to_user_id: Optional[str] = None,
    client_visible: Optional[bool] = None,
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DeliveryService = Depends(get_delivery_service)
):
    """List all tasks with optional filters for assignee, client visibility, and project."""
    return service.get_tasks(
        assigned_to_user_id=assigned_to_user_id,
        client_visible=client_visible,
        project_id=project_id
    )

@router.patch("/tasks/{task_id}/status")
def update_task_status(
    task_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Update task status."""
    new_status = payload.get("status", "done")
    return service.update_task_status(task_id, new_status)

@router.get("/dashboard")
@router.get("/metrics")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Get aggregate metrics for the delivery dashboard."""
    return service.get_dashboard_metrics()
