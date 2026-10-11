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
from src.models.identity import User
from src.models.projects import (
    ChecklistItem,
    Milestone,
    Project,
    Sprint,
    Subtask,
    Task,
    TaskComment,
    TimeEntry,
)
from src.schemas.projects import (
    ChecklistItemCreate,
    ChecklistItemRead,
    MilestoneCreate,
    MilestoneRead,
    ProjectCreate,
    ProjectRead,
    SprintCreate,
    SprintRead,
    SubtaskCreate,
    SubtaskRead,
    TaskCommentCreate,
    TaskCommentRead,
    TaskCreate,
    TaskRead,
    TaskUpdate,
    TimeEntryRead,
)

router = APIRouter(prefix="/projects", tags=["Project Delivery & Engine"])


def compute_project_health(tasks: List[Task], milestones: List[Milestone]) -> str:
    """Calculates project health status dynamically: ON_TRACK, AT_RISK, or OFF_TRACK."""
    today = date.today()
    overdue_milestones = sum(1 for m in milestones if m.due_date < today and m.status not in ("REACHED", "INVOICED"))
    if overdue_milestones > 0:
        return "OFF_TRACK"

    open_tasks = [t for t in tasks if t.status != "DONE"]
    if not open_tasks:
        return "ON_TRACK"

    overdue_tasks = sum(1 for t in open_tasks if t.due_date and t.due_date < today)
    overdue_ratio = overdue_tasks / len(open_tasks)

    if overdue_ratio > 0.3:
        return "OFF_TRACK"
    elif overdue_ratio > 0.1:
        return "AT_RISK"
    return "ON_TRACK"


# -------------------------------------------------------------
# PROJECTS
# -------------------------------------------------------------
@router.get(
    "",
    response_model=List[ProjectRead],
    dependencies=[Depends(require_permissions("project.read"))],
)
async def list_projects(
    status_filter: Optional[str] = None,
    context: AuthenticatedUserContext = Depends(require_permissions("project.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Project)
        .options(
            selectinload(Project.tasks),
            selectinload(Project.milestones),
        )
        .where(
            Project.organization_id == context.user.organization_id,
            Project.deleted_at.is_(None),
        )
    )
    if status_filter:
        stmt = stmt.where(Project.status == status_filter)

    stmt = stmt.order_by(desc(Project.created_at))
    projects = (await db.execute(stmt)).scalars().all()

    response: List[ProjectRead] = []
    for p in projects:
        # Dynamically evaluate health
        health = compute_project_health(p.tasks, p.milestones)
        total_tasks = len(p.tasks)
        completed_tasks = sum(1 for t in p.tasks if t.status == "DONE")

        response.append(
            ProjectRead(
                id=p.id,
                organization_id=p.organization_id,
                account_id=p.account_id,
                manager_id=p.manager_id,
                project_code=p.project_code,
                name=p.name,
                description=p.description,
                billing_type=p.billing_type,
                status=p.status,
                health_status=health,
                total_budget=p.total_budget,
                start_date=p.start_date,
                target_end_date=p.target_end_date,
                tags=p.tags,
                created_at=p.created_at,
                tasks_count=total_tasks,
                completed_tasks_count=completed_tasks,
            )
        )
    return response


@router.post(
    "",
    response_model=ProjectRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("project.create"))],
)
async def create_project(
    payload: ProjectCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("project.create")),
    db: AsyncSession = Depends(get_db_session),
):
    # Check project code uniqueness in organization
    existing = (
        await db.execute(
            select(Project).where(
                Project.organization_id == context.user.organization_id,
                Project.project_code == payload.project_code,
                Project.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Project code already in use")

    p = Project(
        organization_id=context.user.organization_id,
        account_id=payload.account_id,
        manager_id=context.user.id,
        project_code=payload.project_code.upper(),
        name=payload.name,
        description=payload.description,
        billing_type=payload.billing_type,
        total_budget=payload.total_budget,
        start_date=payload.start_date,
        target_end_date=payload.target_end_date,
        tags=payload.tags,
        status="PLANNING",
        health_status="ON_TRACK",
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)

    return ProjectRead(
        id=p.id,
        organization_id=p.organization_id,
        account_id=p.account_id,
        manager_id=p.manager_id,
        project_code=p.project_code,
        name=p.name,
        description=p.description,
        billing_type=p.billing_type,
        status=p.status,
        health_status=p.health_status,
        total_budget=p.total_budget,
        start_date=p.start_date,
        target_end_date=p.target_end_date,
        tags=p.tags,
        created_at=p.created_at,
        tasks_count=0,
        completed_tasks_count=0,
    )


# -------------------------------------------------------------
# MILESTONES & SPRINTS
# -------------------------------------------------------------
@router.get("/{project_id}/milestones", response_model=List[MilestoneRead])
async def list_milestones(
    project_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("project.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Milestone)
        .where(Milestone.project_id == project_id)
        .order_by(Milestone.due_date)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/{project_id}/milestones",
    response_model=MilestoneRead,
    dependencies=[Depends(require_permissions("project.milestone.manage"))],
)
async def create_milestone(
    project_id: uuid.UUID,
    payload: MilestoneCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("project.milestone.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    m = Milestone(
        project_id=project_id,
        title=payload.title,
        description=payload.description,
        billing_percentage=payload.billing_percentage,
        due_date=payload.due_date,
        status=payload.status,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


@router.get("/{project_id}/sprints", response_model=List[SprintRead])
async def list_sprints(
    project_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("project.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Sprint)
        .where(Sprint.project_id == project_id)
        .order_by(desc(Sprint.start_date))
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/{project_id}/sprints",
    response_model=SprintRead,
    dependencies=[Depends(require_permissions("project.sprint.manage"))],
)
async def create_sprint(
    project_id: uuid.UUID,
    payload: SprintCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("project.sprint.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    s = Sprint(
        project_id=project_id,
        name=payload.name,
        goal=payload.goal,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=payload.status,
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


# -------------------------------------------------------------
# TASK SYSTEM
# -------------------------------------------------------------
@router.get("/{project_id}/tasks", response_model=List[TaskRead])
async def list_project_tasks(
    project_id: uuid.UUID,
    sprint_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = None,
    context: AuthenticatedUserContext = Depends(require_permissions("project.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Task, User.full_name.label("assignee_name"))
        .outerjoin(User, Task.assignee_id == User.id)
        .options(
            selectinload(Task.subtasks),
            selectinload(Task.checklist_items),
        )
        .where(Task.project_id == project_id, Task.deleted_at.is_(None))
    )
    if sprint_id:
        stmt = stmt.where(Task.sprint_id == sprint_id)
    if status_filter:
        stmt = stmt.where(Task.status == status_filter)

    stmt = stmt.order_by(Task.due_date.asc())
    rows = (await db.execute(stmt)).all()

    return [
        TaskRead(
            id=t.id,
            project_id=t.project_id,
            sprint_id=t.sprint_id,
            milestone_id=t.milestone_id,
            assignee_id=t.assignee_id,
            title=t.title,
            description=t.description,
            status=t.status,
            priority=t.priority,
            estimated_hours=t.estimated_hours,
            due_date=t.due_date,
            created_at=t.created_at,
            assignee_name=u_name,
            subtasks=[SubtaskRead.model_validate(st) for st in t.subtasks],
            checklist_items=[ChecklistItemRead.model_validate(ci) for ci in t.checklist_items],
        )
        for t, u_name in rows
    ]


@router.post(
    "/{project_id}/tasks",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("task.create"))],
)
async def create_task(
    project_id: uuid.UUID,
    payload: TaskCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("task.create")),
    db: AsyncSession = Depends(get_db_session),
):
    t = Task(
        project_id=project_id,
        sprint_id=payload.sprint_id,
        milestone_id=payload.milestone_id,
        assignee_id=payload.assignee_id,
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        estimated_hours=payload.estimated_hours,
        due_date=payload.due_date,
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)

    assignee_name = None
    if t.assignee_id:
        assignee_name = (
            await db.execute(select(User.full_name).where(User.id == t.assignee_id))
        ).scalar_one_or_none()

    return TaskRead(
        id=t.id,
        project_id=t.project_id,
        sprint_id=t.sprint_id,
        milestone_id=t.milestone_id,
        assignee_id=t.assignee_id,
        title=t.title,
        description=t.description,
        status=t.status,
        priority=t.priority,
        estimated_hours=t.estimated_hours,
        due_date=t.due_date,
        created_at=t.created_at,
        assignee_name=assignee_name,
    )


@router.patch("/tasks/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    context: AuthenticatedUserContext = Depends(require_permissions("task.update")),
    db: AsyncSession = Depends(get_db_session),
):
    t = (
        await db.execute(
            select(Task)
            .options(selectinload(Task.subtasks), selectinload(Task.checklist_items))
            .where(Task.id == task_id, Task.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        t.title = payload.title
    if payload.description is not None:
        t.description = payload.description
    if payload.status is not None:
        t.status = payload.status
    if payload.priority is not None:
        t.priority = payload.priority
    if payload.assignee_id is not None:
        t.assignee_id = payload.assignee_id
    if payload.estimated_hours is not None:
        t.estimated_hours = payload.estimated_hours
    if payload.due_date is not None:
        t.due_date = payload.due_date

    await db.commit()
    await db.refresh(t)

    assignee_name = None
    if t.assignee_id:
        assignee_name = (
            await db.execute(select(User.full_name).where(User.id == t.assignee_id))
        ).scalar_one_or_none()

    return TaskRead(
        id=t.id,
        project_id=t.project_id,
        sprint_id=t.sprint_id,
        milestone_id=t.milestone_id,
        assignee_id=t.assignee_id,
        title=t.title,
        description=t.description,
        status=t.status,
        priority=t.priority,
        estimated_hours=t.estimated_hours,
        due_date=t.due_date,
        created_at=t.created_at,
        assignee_name=assignee_name,
        subtasks=[SubtaskRead.model_validate(st) for st in t.subtasks],
        checklist_items=[ChecklistItemRead.model_validate(ci) for ci in t.checklist_items],
    )


# -------------------------------------------------------------
# TASK DETAILS: SUBTASKS, CHECKLISTS, COMMENTS
# -------------------------------------------------------------
@router.post("/tasks/{task_id}/subtasks", response_model=SubtaskRead)
async def create_subtask(
    task_id: uuid.UUID,
    payload: SubtaskCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("task.update")),
    db: AsyncSession = Depends(get_db_session),
):
    st = Subtask(task_id=task_id, title=payload.title, is_completed=False)
    db.add(st)
    await db.commit()
    await db.refresh(st)
    return st


@router.patch("/tasks/subtasks/{subtask_id}")
async def toggle_subtask(
    subtask_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("task.update")),
    db: AsyncSession = Depends(get_db_session),
):
    st = (await db.execute(select(Subtask).where(Subtask.id == subtask_id))).scalar_one_or_none()
    if not st:
        raise HTTPException(status_code=404, detail="Subtask not found")
    st.is_completed = not st.is_completed
    await db.commit()
    return {"id": st.id, "is_completed": st.is_completed}


@router.post("/tasks/{task_id}/checklist", response_model=ChecklistItemRead)
async def add_checklist_item(
    task_id: uuid.UUID,
    payload: ChecklistItemCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("task.update")),
    db: AsyncSession = Depends(get_db_session),
):
    ci = ChecklistItem(task_id=task_id, content=payload.content, is_checked=False)
    db.add(ci)
    await db.commit()
    await db.refresh(ci)
    return ci


@router.patch("/tasks/checklist/{item_id}")
async def toggle_checklist_item(
    item_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("task.update")),
    db: AsyncSession = Depends(get_db_session),
):
    ci = (await db.execute(select(ChecklistItem).where(ChecklistItem.id == item_id))).scalar_one_or_none()
    if not ci:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    ci.is_checked = not ci.is_checked
    await db.commit()
    return {"id": ci.id, "is_checked": ci.is_checked}


@router.get("/tasks/{task_id}/comments", response_model=List[TaskCommentRead])
async def list_task_comments(
    task_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(TaskComment, User.full_name)
        .join(User, TaskComment.author_id == User.id)
        .where(TaskComment.task_id == task_id)
        .order_by(TaskComment.created_at.asc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        TaskCommentRead(
            id=c.id,
            task_id=c.task_id,
            author_id=c.author_id,
            content=c.content,
            mentions=c.mentions,
            created_at=c.created_at,
            author_name=u_name,
        )
        for c, u_name in rows
    ]


@router.post("/tasks/{task_id}/comments", response_model=TaskCommentRead)
async def add_task_comment(
    task_id: uuid.UUID,
    payload: TaskCommentCreate,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    c = TaskComment(
        task_id=task_id,
        author_id=context.user.id,
        content=payload.content,
        mentions=payload.mentions,
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)

    return TaskCommentRead(
        id=c.id,
        task_id=c.task_id,
        author_id=c.author_id,
        content=c.content,
        mentions=c.mentions,
        created_at=c.created_at,
        author_name=context.user.full_name,
    )


# -------------------------------------------------------------
# LIVE TIMERS & TIME TRACKING
# -------------------------------------------------------------
@router.post("/tasks/{task_id}/timer/start", response_model=TimeEntryRead)
async def start_timer(
    task_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    # Stop any currently active timer for this user
    active_stmt = select(TimeEntry).where(
        TimeEntry.user_id == context.user.id,
        TimeEntry.is_running.is_(True),
    )
    active = (await db.execute(active_stmt)).scalars().all()
    now = datetime.now(timezone.utc)
    for entry in active:
        entry.is_running = False
        entry.end_time = now
        entry.duration_seconds = int((now - entry.start_time).total_seconds())

    new_entry = TimeEntry(
        task_id=task_id,
        user_id=context.user.id,
        start_time=now,
        is_running=True,
    )
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)

    return TimeEntryRead(
        id=new_entry.id,
        task_id=new_entry.task_id,
        user_id=new_entry.user_id,
        start_time=new_entry.start_time,
        end_time=new_entry.end_time,
        duration_seconds=new_entry.duration_seconds,
        is_running=new_entry.is_running,
        description=new_entry.description,
        user_name=context.user.full_name,
    )


@router.post("/tasks/{task_id}/timer/stop", response_model=TimeEntryRead)
async def stop_timer(
    task_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(TimeEntry).where(
        TimeEntry.task_id == task_id,
        TimeEntry.user_id == context.user.id,
        TimeEntry.is_running.is_(True),
    )
    entry = (await db.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=400, detail="No running timer found for this task")

    now = datetime.now(timezone.utc)
    entry.is_running = False
    entry.end_time = now
    entry.duration_seconds = int((now - entry.start_time).total_seconds())

    await db.commit()
    await db.refresh(entry)

    return TimeEntryRead(
        id=entry.id,
        task_id=entry.task_id,
        user_id=entry.user_id,
        start_time=entry.start_time,
        end_time=entry.end_time,
        duration_seconds=entry.duration_seconds,
        is_running=entry.is_running,
        description=entry.description,
        user_name=context.user.full_name,
    )


# -------------------------------------------------------------
# MY WORK WORKSPACE (PERSONALIZED EMPLOYEE DASHBOARD)
# -------------------------------------------------------------
@router.get("/my-work")
async def get_my_work(
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    today = date.today()

    # 1. Today's & In Progress Tasks
    tasks_stmt = (
        select(Task, Project.name.label("project_name"))
        .join(Project, Task.project_id == Project.id)
        .where(
            Task.assignee_id == context.user.id,
            Task.deleted_at.is_(None),
        )
    )
    rows = (await db.execute(tasks_stmt)).all()

    today_tasks = []
    overdue_tasks = []
    for t, p_name in rows:
        item = {
            "id": t.id,
            "project_id": t.project_id,
            "project_name": p_name,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "estimated_hours": float(t.estimated_hours),
            "due_date": t.due_date,
        }
        if t.status != "DONE" and t.due_date and t.due_date < today:
            overdue_tasks.append(item)
        elif t.status != "DONE":
            today_tasks.append(item)

    # 2. Check running timer
    active_timer_stmt = (
        select(TimeEntry, Task.title.label("task_title"))
        .join(Task, TimeEntry.task_id == Task.id)
        .where(
            TimeEntry.user_id == context.user.id,
            TimeEntry.is_running.is_(True),
        )
    )
    active_row = (await db.execute(active_timer_stmt)).first()
    active_timer = None
    if active_row:
        te, task_title = active_row
        active_timer = {
            "id": te.id,
            "task_id": te.task_id,
            "task_title": task_title,
            "start_time": te.start_time,
            "elapsed_seconds": int((datetime.now(timezone.utc) - te.start_time).total_seconds()),
        }

    return {
        "today_tasks": today_tasks,
        "overdue_tasks": overdue_tasks,
        "active_timer": active_timer,
    }
