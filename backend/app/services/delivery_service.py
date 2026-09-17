from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
import re

from app.models.delivery import Project, Milestone, Task, Subtask, DeliveryComment
from app.models.crm import Deal, Company
from app.models.auth import User
from app.models.system import Notification
from app.schemas.delivery import (
    ProjectCreate, ProjectResponse, 
    MilestoneCreate, MilestoneResponse,
    TaskCreate, TaskUpdate, TaskResponse, KanbanMoveRequest,
    DeliveryCommentCreate, DeliveryCommentResponse
)
from app.core.exceptions import KapateAppException
from app.core.logging import logger


class DeliveryService:
    def __init__(self, db: Session):
        self.db = db

    # --- Deals to Projects ---
    def convert_deal_to_project(self, deal_id: str, project_manager_id: Optional[str] = None) -> ProjectResponse:
        deal = self.db.query(Deal).filter(Deal.id == deal_id).first()
        if not deal:
            raise KapateAppException(status_code=404, detail="Deal not found")
        if deal.stage != "closed_won":
            raise KapateAppException(status_code=400, detail="Only CLOSED WON deals can be converted to projects")
            
        count = self.db.query(func.count(Project.id)).scalar() or 0
        code = f"PRJ-{count + 1:04d}"

        p = Project(
            company_id=deal.company_id,
            deal_id=deal.id,
            project_code=code,
            name=f"Project: {deal.title}",
            description=deal.description,
            status="PLANNING",
            budget=deal.amount,
            currency=deal.currency,
            project_manager_id=project_manager_id
        )
        self.db.add(p)
        self.db.commit()
        self.db.refresh(p)
        
        return ProjectResponse.model_validate(p)

    # --- Tasks & Kanban ---
    def create_task(self, data: TaskCreate, requesting_user: Optional[User] = None) -> TaskResponse:
        if requesting_user:
            roles = [r.name.lower() for r in requesting_user.roles]
            if "client" in roles:
                from fastapi import HTTPException
                raise HTTPException(status_code=403, detail="Clients cannot create or assign internal employee tasks directly.")
            
            if "intern" in roles and data.assigned_to_user_id and data.assigned_to_user_id != requesting_user.id:
                assignee = self.db.query(User).filter(User.id == data.assigned_to_user_id).first()
                if assignee:
                    assignee_roles = [r.name.lower() for r in assignee.roles]
                    if any(r in ["superadmin", "admin", "partner", "consultant"] for r in assignee_roles):
                        from fastapi import HTTPException
                        raise HTTPException(status_code=403, detail="Interns cannot assign tasks to managers or administrators.")

        t = Task(**data.model_dump())
        self.db.add(t)
        self.db.commit()
        self.db.refresh(t)

        # Notify assignee if assigned
        if t.assigned_to_user_id:
            notif = Notification(
                user_id=t.assigned_to_user_id,
                title=f"New Task Assigned: {t.title}",
                message=f"You have been assigned to task '{t.title}'. Priority: {t.priority}. Due: {t.due_date}",
                link="/dashboard/tasks",
                notification_type="action_required"
            )
            self.db.add(notif)
            self.db.commit()

        return TaskResponse.model_validate(t)

    def move_task_kanban(self, task_id: str, payload: KanbanMoveRequest) -> TaskResponse:
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise KapateAppException(status_code=404, detail="Task not found")
            
        task.status = payload.new_status
        task.board_order = payload.new_board_order
        self.db.commit()
        self.db.refresh(task)
        
        return TaskResponse.model_validate(task)

    # --- Comments & Mentions ---
    def add_comment(self, payload: DeliveryCommentCreate, current_user_id: str) -> DeliveryCommentResponse:
        comment = DeliveryComment(
            **payload.model_dump(),
            user_id=current_user_id
        )
        self.db.add(comment)
        self.db.flush() # flush to get comment.id
        
        # Parse @mentions
        mentions = re.findall(r'@([a-zA-Z0-9_\.]+)', payload.comment_text)
        if mentions:
            for mention in mentions:
                # Naive matching: match first_name.last_name or email prefix
                user = self.db.query(User).filter(User.email.ilike(f"{mention}%")).first()
                if user:
                    notif = Notification(
                        user_id=user.id,
                        title="You were mentioned",
                        message=f"You were mentioned in a comment on {payload.entity_type}",
                        type="mention",
                        link_url=f"/delivery/{payload.entity_type}s/{payload.entity_id}"
                    )
                    self.db.add(notif)
                    
        self.db.commit()
        self.db.refresh(comment)
        return DeliveryCommentResponse.model_validate(comment)

    # --- Dashboards & Fetching ---
    def get_projects(self) -> List[Dict[str, Any]]:
        projects = self.db.query(Project).all()
        result = []
        for p in projects:
            result.append({
                "id": p.id,
                "project_code": p.project_code,
                "name": p.name,
                "description": p.description,
                "status": p.status,
                "budget": float(p.budget) if p.budget else 0.0,
                "currency": p.currency,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
                "project_manager_id": p.project_manager_id,
            })
        return result

    def get_project_detail(self, project_id: str) -> Dict[str, Any]:
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise KapateAppException(status_code=404, detail="Project not found")
        
        milestones = [{"id": m.id, "title": m.title, "status": m.status} for m in project.milestones]
        tasks = [{"id": t.id, "title": t.title, "status": t.status} for t in project.tasks]
        allocations = [{"id": a.id, "user_id": a.user_id, "role": a.role_in_project} for a in project.allocations]
        
        return {
            "id": project.id,
            "project_code": project.project_code,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "budget": float(project.budget) if project.budget else 0.0,
            "currency": project.currency,
            "milestones": milestones,
            "tasks": tasks,
            "allocations": allocations,
        }

    def get_tasks(
        self,
        assigned_to_user_id: Optional[str] = None,
        client_visible: Optional[bool] = None,
        project_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = self.db.query(Task)
        if assigned_to_user_id:
            query = query.filter(Task.assigned_to_user_id == assigned_to_user_id)
        if client_visible is not None:
            query = query.filter(Task.client_visible == client_visible)
        if project_id:
            query = query.filter(Task.project_id == project_id)

        tasks = query.order_by(Task.due_date.asc().nulls_last()).all()
        return [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "status": t.status,
                "priority": t.priority,
                "client_visible": t.client_visible,
                "project_id": t.project_id,
                "project_name": t.project.name if t.project else None,
                "assigned_to_user_id": t.assigned_to_user_id,
                "assignee_name": t.assignee.full_name if t.assignee else "Unassigned",
                "assignee_email": t.assignee.email if t.assignee else None,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "estimated_hours": float(t.estimated_hours) if t.estimated_hours else None,
                "actual_hours": float(t.actual_hours) if t.actual_hours else 0.0
            }
            for t in tasks
        ]

    def update_task_status(self, task_id: str, new_status: str) -> Dict[str, Any]:
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise KapateAppException(status_code=404, detail="Task not found")
        task.status = new_status
        self.db.commit()
        self.db.refresh(task)
        return {
            "id": task.id,
            "title": task.title,
            "status": task.status
        }

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        total_projects = self.db.query(Project).count()
        active_projects = self.db.query(Project).filter(Project.status.notin_(["COMPLETED", "CANCELLED", "completed"])).count()
        open_tasks = self.db.query(Task).filter(Task.status != "done").count()
        overdue_tasks = self.db.query(Task).filter(Task.due_date < date.today(), Task.status != "done").count()
        total_budget = self.db.query(func.sum(Project.budget)).scalar() or Decimal(0.0)
        
        return {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "open_tasks": open_tasks,
            "overdue_tasks": overdue_tasks,
            "total_budget": float(total_budget)
        }
