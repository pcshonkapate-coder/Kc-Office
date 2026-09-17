from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from app.models.delivery import Project, Milestone, Task, Subtask, TaskComment, ResourceAllocation
from app.models.crm import Company
from app.models.auth import User


class DeliveryRepository:
    def __init__(self, db: Session):
        self.db = db

    # ==================== PROJECTS ====================
    def get_projects(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        company_id: Optional[str] = None,
    ) -> List[Project]:
        query = self.db.query(Project).options(
            joinedload(Project.company),
            joinedload(Project.project_manager),
            joinedload(Project.milestones),
            joinedload(Project.tasks),
            joinedload(Project.allocations),
        ).filter(Project.is_deleted.is_(False))

        if status and status != "all":
            query = query.filter(Project.status == status)
        if company_id:
            query = query.filter(Project.company_id == company_id)
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(Project.name).like(s),
                    func.lower(Project.project_code).like(s),
                )
            )
        return query.order_by(Project.created_at.desc()).all()

    def get_project_by_id(self, project_id: str) -> Optional[Project]:
        return self.db.query(Project).options(
            joinedload(Project.company),
            joinedload(Project.project_manager),
            joinedload(Project.milestones),
            joinedload(Project.tasks).joinedload(Task.assignee),
            joinedload(Project.allocations).joinedload(ResourceAllocation.user),
        ).filter(Project.id == project_id, Project.is_deleted.is_(False)).first()

    def get_project_by_code(self, code: str) -> Optional[Project]:
        return self.db.query(Project).filter(Project.project_code == code, Project.is_deleted.is_(False)).first()

    def create_project(self, project: Project) -> Project:
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update_project(self, project: Project, data: dict) -> Project:
        for k, v in data.items():
            if v is not None:
                setattr(project, k, v)
        self.db.commit()
        self.db.refresh(project)
        return project

    # ==================== MILESTONES ====================
    def get_milestones(self, project_id: Optional[str] = None) -> List[Milestone]:
        query = self.db.query(Milestone)
        if project_id:
            query = query.filter(Milestone.project_id == project_id)
        return query.order_by(Milestone.due_date.asc()).all()

    def get_milestone_by_id(self, milestone_id: str) -> Optional[Milestone]:
        return self.db.query(Milestone).filter(Milestone.id == milestone_id).first()

    def create_milestone(self, milestone: Milestone) -> Milestone:
        self.db.add(milestone)
        self.db.commit()
        self.db.refresh(milestone)
        return milestone

    def update_milestone(self, milestone: Milestone, data: dict) -> Milestone:
        for k, v in data.items():
            if v is not None:
                setattr(milestone, k, v)
        self.db.commit()
        self.db.refresh(milestone)
        return milestone

    # ==================== TASKS ====================
    def get_tasks(
        self,
        project_id: Optional[str] = None,
        milestone_id: Optional[str] = None,
        assignee_id: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Task]:
        query = self.db.query(Task).options(
            joinedload(Task.project),
            joinedload(Task.milestone),
            joinedload(Task.assignee),
            joinedload(Task.subtasks),
            joinedload(Task.comments),
        ).filter(Task.is_deleted.is_(False))

        if project_id:
            query = query.filter(Task.project_id == project_id)
        if milestone_id:
            query = query.filter(Task.milestone_id == milestone_id)
        if assignee_id:
            query = query.filter(Task.assigned_to_user_id == assignee_id)
        if status and status != "all":
            query = query.filter(Task.status == status)
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(func.lower(Task.title).like(s))

        return query.order_by(Task.created_at.desc()).all()

    def get_task_by_id(self, task_id: str) -> Optional[Task]:
        return self.db.query(Task).options(
            joinedload(Task.project),
            joinedload(Task.milestone),
            joinedload(Task.assignee),
            joinedload(Task.subtasks),
            joinedload(Task.comments).joinedload(TaskComment.author),
        ).filter(Task.id == task_id, Task.is_deleted.is_(False)).first()

    def create_task(self, task: Task) -> Task:
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def update_task(self, task: Task, data: dict) -> Task:
        for k, v in data.items():
            if v is not None:
                setattr(task, k, v)
        self.db.commit()
        self.db.refresh(task)
        return task

    def update_task_status(self, task: Task, new_status: str) -> Task:
        task.status = new_status
        self.db.commit()
        self.db.refresh(task)
        return task

    # ==================== TASK COMMENTS ====================
    def add_task_comment(self, comment: TaskComment) -> TaskComment:
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    # ==================== RESOURCE ALLOCATIONS ====================
    def get_allocations(self, project_id: Optional[str] = None, user_id: Optional[str] = None) -> List[ResourceAllocation]:
        query = self.db.query(ResourceAllocation).options(
            joinedload(ResourceAllocation.project),
            joinedload(ResourceAllocation.user),
        )
        if project_id:
            query = query.filter(ResourceAllocation.project_id == project_id)
        if user_id:
            query = query.filter(ResourceAllocation.user_id == user_id)
        return query.all()

    def create_allocation(self, alloc: ResourceAllocation) -> ResourceAllocation:
        self.db.add(alloc)
        self.db.commit()
        self.db.refresh(alloc)
        return alloc

    # ==================== METRICS ====================
    def get_metrics(self) -> Dict[str, Any]:
        total_projects = self.db.query(func.count(Project.id)).filter(Project.is_deleted.is_(False)).scalar() or 0
        active_projects = self.db.query(func.count(Project.id)).filter(Project.status == "active", Project.is_deleted.is_(False)).scalar() or 0
        completed_projects = self.db.query(func.count(Project.id)).filter(Project.status == "completed", Project.is_deleted.is_(False)).scalar() or 0
        on_hold_projects = self.db.query(func.count(Project.id)).filter(Project.status == "on_hold", Project.is_deleted.is_(False)).scalar() or 0

        pipeline_val = self.db.query(func.sum(Project.budget)).filter(Project.is_deleted.is_(False)).scalar() or Decimal("0.00")

        open_tasks = self.db.query(func.count(Task.id)).filter(Task.status.in_(["todo", "in_progress", "review"]), Task.is_deleted.is_(False)).scalar() or 0
        completed_tasks = self.db.query(func.count(Task.id)).filter(Task.status == "done", Task.is_deleted.is_(False)).scalar() or 0

        # Status counts
        status_counts = (
            self.db.query(Task.status, func.count(Task.id))
            .filter(Task.is_deleted.is_(False))
            .group_by(Task.status)
            .all()
        )
        tasks_by_status = {s: count for s, count in status_counts}

        return {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "completed_projects": completed_projects,
            "on_hold_projects": on_hold_projects,
            "total_pipeline_delivery_value": pipeline_val,
            "open_tasks": open_tasks,
            "completed_tasks": completed_tasks,
            "tasks_by_status": tasks_by_status,
        }
