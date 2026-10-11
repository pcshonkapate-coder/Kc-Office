from datetime import date, datetime, timezone
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
from src.models.identity import User
from src.models.workforce import (
    AttendanceLog,
    Department,
    Employee,
    InternProfile,
    LeaveRequest,
    Team,
)
from src.schemas.workforce import (
    AttendanceLogRead,
    ClockInOutResponse,
    DepartmentCreate,
    DepartmentRead,
    EmployeeCreate,
    EmployeeRead,
    InternProfileCreate,
    InternProfileRead,
    LeaveRequestCreate,
    LeaveRequestRead,
    LeaveRequestStatusUpdate,
)

router = APIRouter(prefix="/workforce", tags=["People & Workforce"])


# -------------------------------------------------------------
# DEPARTMENTS
# -------------------------------------------------------------
@router.get(
    "/departments",
    response_model=List[DepartmentRead],
    dependencies=[Depends(require_permissions("hr.employee.read"))],
)
async def list_departments(
    context: AuthenticatedUserContext = Depends(require_permissions("hr.employee.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Department)
        .where(
            Department.organization_id == context.user.organization_id,
            Department.deleted_at.is_(None),
        )
        .order_by(Department.name)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/departments",
    response_model=DepartmentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("hr.employee.create"))],
)
async def create_department(
    payload: DepartmentCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("hr.employee.create")),
    db: AsyncSession = Depends(get_db_session),
):
    dept = Department(
        organization_id=context.user.organization_id,
        name=payload.name,
        code=payload.code.upper(),
        description=payload.description,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


# -------------------------------------------------------------
# EMPLOYEES
# -------------------------------------------------------------
@router.get(
    "/employees",
    response_model=List[EmployeeRead],
    dependencies=[Depends(require_permissions("hr.employee.read"))],
)
async def list_employees(
    department_id: Optional[uuid.UUID] = None,
    employment_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    context: AuthenticatedUserContext = Depends(require_permissions("hr.employee.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Employee, User.full_name, User.email, Department.name.label("department_name"))
        .join(User, Employee.user_id == User.id)
        .outerjoin(Department, Employee.department_id == Department.id)
        .where(
            Employee.organization_id == context.user.organization_id,
            Employee.deleted_at.is_(None),
        )
    )

    if department_id:
        stmt = stmt.where(Employee.department_id == department_id)
    if employment_type:
        stmt = stmt.where(Employee.employment_type == employment_type)
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            (User.full_name.ilike(search_filter))
            | (User.email.ilike(search_filter))
            | (Employee.employee_code.ilike(search_filter))
            | (Employee.job_title.ilike(search_filter))
        )

    stmt = stmt.order_by(User.full_name).offset(offset).limit(limit)
    rows = (await db.execute(stmt)).all()

    response: List[EmployeeRead] = []
    for emp, full_name, email, dept_name in rows:
        emp_dict = {
            "id": emp.id,
            "organization_id": emp.organization_id,
            "user_id": emp.user_id,
            "department_id": emp.department_id,
            "team_id": emp.team_id,
            "employee_code": emp.employee_code,
            "job_title": emp.job_title,
            "employment_type": emp.employment_type,
            "hourly_cost_rate": emp.hourly_cost_rate,
            "joined_date": emp.joined_date,
            "full_name": full_name,
            "email": email,
            "department_name": dept_name,
        }
        response.append(EmployeeRead.model_validate(emp_dict))
    return response


@router.post(
    "/employees",
    response_model=EmployeeRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("hr.employee.create"))],
)
async def create_employee(
    payload: EmployeeCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("hr.employee.create")),
    db: AsyncSession = Depends(get_db_session),
):
    # Verify User exists in Organization
    user_stmt = select(User).where(
        User.id == payload.user_id,
        User.organization_id == context.user.organization_id,
        User.deleted_at.is_(None),
    )
    user = (await db.execute(user_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found in this organization")

    # Check if employee record already exists
    existing_emp = (
        await db.execute(select(Employee).where(Employee.user_id == payload.user_id))
    ).scalar_one_or_none()
    if existing_emp:
        raise HTTPException(status_code=409, detail="Employee profile already exists for this user")

    emp = Employee(
        organization_id=context.user.organization_id,
        user_id=payload.user_id,
        department_id=payload.department_id,
        team_id=payload.team_id,
        manager_id=payload.manager_id,
        employee_code=payload.employee_code,
        job_title=payload.job_title,
        employment_type=payload.employment_type,
        hourly_cost_rate=payload.hourly_cost_rate,
        joined_date=payload.joined_date,
    )
    db.add(emp)
    await db.commit()
    await db.refresh(emp)

    return EmployeeRead(
        id=emp.id,
        organization_id=emp.organization_id,
        user_id=emp.user_id,
        department_id=emp.department_id,
        team_id=emp.team_id,
        employee_code=emp.employee_code,
        job_title=emp.job_title,
        employment_type=emp.employment_type,
        hourly_cost_rate=emp.hourly_cost_rate,
        joined_date=emp.joined_date,
        full_name=user.full_name,
        email=user.email,
    )


# -------------------------------------------------------------
# INTERN LEARNING HUB
# -------------------------------------------------------------
@router.get(
    "/interns",
    response_model=List[InternProfileRead],
    dependencies=[Depends(require_permissions("hr.employee.read"))],
)
async def list_interns(
    context: AuthenticatedUserContext = Depends(require_permissions("hr.employee.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(InternProfile)
        .join(Employee, InternProfile.employee_id == Employee.id)
        .where(Employee.organization_id == context.user.organization_id)
        .order_by(desc(InternProfile.created_at))
    )
    result = await db.execute(stmt)
    interns = result.scalars().all()

    # Hydrate names
    response: List[InternProfileRead] = []
    for intern in interns:
        emp_user = (
            await db.execute(
                select(User.full_name).join(Employee, Employee.user_id == User.id).where(Employee.id == intern.employee_id)
            )
        ).scalar_one_or_none()

        mentor_user = None
        if intern.mentor_id:
            mentor_user = (
                await db.execute(
                    select(User.full_name).join(Employee, Employee.user_id == User.id).where(Employee.id == intern.mentor_id)
                )
            ).scalar_one_or_none()

        response.append(
            InternProfileRead(
                id=intern.id,
                employee_id=intern.employee_id,
                mentor_id=intern.mentor_id,
                university=intern.university,
                internship_start_date=intern.internship_start_date,
                internship_end_date=intern.internship_end_date,
                stipend=intern.stipend,
                certificate_issued=intern.certificate_issued,
                intern_name=emp_user,
                mentor_name=mentor_user,
            )
        )
    return response


# -------------------------------------------------------------
# ATTENDANCE (CLOCK IN / CLOCK OUT)
# -------------------------------------------------------------
@router.post("/attendance/clock-in", response_model=ClockInOutResponse)
async def clock_in(
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    # Find employee profile for current user
    emp_stmt = select(Employee).where(Employee.user_id == context.user.id)
    emp = (await db.execute(emp_stmt)).scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=400, detail="Current user has no associated employee profile")

    today = datetime.now(timezone.utc).date()
    existing_stmt = select(AttendanceLog).where(
        AttendanceLog.employee_id == emp.id,
        AttendanceLog.work_date == today,
    )
    existing_log = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing_log:
        return ClockInOutResponse(
            message="Already clocked in for today",
            log_id=existing_log.id,
            work_date=existing_log.work_date,
            clock_in=existing_log.clock_in,
            clock_out=existing_log.clock_out,
            status=existing_log.status,
        )

    now = datetime.now(timezone.utc)
    new_log = AttendanceLog(
        employee_id=emp.id,
        work_date=today,
        clock_in=now,
        status="PRESENT",
    )
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)

    return ClockInOutResponse(
        message="Clock-in logged successfully",
        log_id=new_log.id,
        work_date=new_log.work_date,
        clock_in=new_log.clock_in,
        clock_out=new_log.clock_out,
        status=new_log.status,
    )


@router.post("/attendance/clock-out", response_model=ClockInOutResponse)
async def clock_out(
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    emp_stmt = select(Employee).where(Employee.user_id == context.user.id)
    emp = (await db.execute(emp_stmt)).scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=400, detail="Current user has no associated employee profile")

    today = datetime.now(timezone.utc).date()
    existing_stmt = select(AttendanceLog).where(
        AttendanceLog.employee_id == emp.id,
        AttendanceLog.work_date == today,
    )
    log = (await db.execute(existing_stmt)).scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=400, detail="Must clock in before clocking out")

    log.clock_out = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(log)

    return ClockInOutResponse(
        message="Clock-out logged successfully",
        log_id=log.id,
        work_date=log.work_date,
        clock_in=log.clock_in,
        clock_out=log.clock_out,
        status=log.status,
    )


@router.get(
    "/attendance",
    response_model=List[AttendanceLogRead],
    dependencies=[Depends(require_permissions("hr.attendance.manage"))],
)
async def list_attendance_logs(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(50, ge=1, le=100),
    context: AuthenticatedUserContext = Depends(require_permissions("hr.attendance.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(AttendanceLog, User.full_name)
        .join(Employee, AttendanceLog.employee_id == Employee.id)
        .join(User, Employee.user_id == User.id)
        .where(Employee.organization_id == context.user.organization_id)
    )

    if start_date:
        stmt = stmt.where(AttendanceLog.work_date >= start_date)
    if end_date:
        stmt = stmt.where(AttendanceLog.work_date <= end_date)

    stmt = stmt.order_by(desc(AttendanceLog.work_date), desc(AttendanceLog.clock_in)).limit(limit)
    rows = (await db.execute(stmt)).all()

    return [
        AttendanceLogRead(
            id=log.id,
            employee_id=log.employee_id,
            work_date=log.work_date,
            clock_in=log.clock_in,
            clock_out=log.clock_out,
            status=log.status,
            employee_name=name,
        )
        for log, name in rows
    ]


# -------------------------------------------------------------
# LEAVE REQUESTS
# -------------------------------------------------------------
@router.post("/leaves", response_model=LeaveRequestRead)
async def submit_leave_request(
    payload: LeaveRequestCreate,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    emp = (
        await db.execute(select(Employee).where(Employee.user_id == context.user.id))
    ).scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=400, detail="User has no registered employee record")

    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=400, detail="End date must be greater than or equal to start date")

    total_days = (payload.end_date - payload.start_date).days + 1

    leave = LeaveRequest(
        employee_id=emp.id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_days=total_days,
        reason=payload.reason,
        status="PENDING",
    )
    db.add(leave)
    await db.commit()
    await db.refresh(leave)

    return LeaveRequestRead(
        id=leave.id,
        employee_id=leave.employee_id,
        approver_id=leave.approver_id,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        total_days=leave.total_days,
        reason=leave.reason,
        status=leave.status,
        decision_notes=leave.decision_notes,
        created_at=leave.created_at,
        employee_name=context.user.full_name,
    )


@router.get("/leaves", response_model=List[LeaveRequestRead])
async def list_leave_requests(
    status_filter: Optional[str] = None,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(LeaveRequest, User.full_name)
        .join(Employee, LeaveRequest.employee_id == Employee.id)
        .join(User, Employee.user_id == User.id)
        .where(Employee.organization_id == context.user.organization_id)
    )

    # Non-managers only see their own leave requests
    if not context.has_permission("hr.attendance.manage"):
        stmt = stmt.where(User.id == context.user.id)

    if status_filter:
        stmt = stmt.where(LeaveRequest.status == status_filter)

    stmt = stmt.order_by(desc(LeaveRequest.created_at))
    rows = (await db.execute(stmt)).all()

    return [
        LeaveRequestRead(
            id=leave.id,
            employee_id=leave.employee_id,
            approver_id=leave.approver_id,
            leave_type=leave.leave_type,
            start_date=leave.start_date,
            end_date=leave.end_date,
            total_days=leave.total_days,
            reason=leave.reason,
            status=leave.status,
            decision_notes=leave.decision_notes,
            created_at=leave.created_at,
            employee_name=name,
        )
        for leave, name in rows
    ]


@router.patch(
    "/leaves/{leave_id}/status",
    response_model=LeaveRequestRead,
    dependencies=[Depends(require_permissions("hr.attendance.manage"))],
)
async def update_leave_status(
    leave_id: uuid.UUID,
    payload: LeaveRequestStatusUpdate,
    context: AuthenticatedUserContext = Depends(require_permissions("hr.attendance.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(LeaveRequest)
        .join(Employee, LeaveRequest.employee_id == Employee.id)
        .where(
            LeaveRequest.id == leave_id,
            Employee.organization_id == context.user.organization_id,
        )
    )
    leave = (await db.execute(stmt)).scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave.status = payload.status
    leave.decision_notes = payload.decision_notes
    leave.approver_id = (
        await db.execute(select(Employee.id).where(Employee.user_id == context.user.id))
    ).scalar_one_or_none()

    await db.commit()
    await db.refresh(leave)

    emp_name = (
        await db.execute(
            select(User.full_name).join(Employee, Employee.user_id == User.id).where(Employee.id == leave.employee_id)
        )
    ).scalar_one_or_none()

    return LeaveRequestRead(
        id=leave.id,
        employee_id=leave.employee_id,
        approver_id=leave.approver_id,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        total_days=leave.total_days,
        reason=leave.reason,
        status=leave.status,
        decision_notes=leave.decision_notes,
        created_at=leave.created_at,
        employee_name=emp_name,
    )
