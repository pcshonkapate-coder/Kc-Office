import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.dependencies.auth import (
    AuthenticatedUserContext,
    require_permissions,
)
from src.core.database import get_db_session
from src.models.identity import Permission, Role, RolePermission
from src.schemas.identity import PermissionRead, RoleCreate, RoleRead

router = APIRouter(prefix="/rbac", tags=["Role-Based Access Control"])


@router.get(
    "/permissions",
    response_model=List[PermissionRead],
    dependencies=[Depends(require_permissions("permission.read"))],
)
async def list_permissions(
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(Permission).order_by(Permission.module, Permission.code)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/roles",
    response_model=List[RoleRead],
    dependencies=[Depends(require_permissions("role.read"))],
)
async def list_roles(
    context: AuthenticatedUserContext = Depends(require_permissions("role.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Role)
        .options(
            selectinload(Role.role_permissions).selectinload(RolePermission.permission)
        )
        .where(
            (Role.organization_id == context.user.organization_id)
            | (Role.is_system.is_(True)),
            Role.deleted_at.is_(None),
        )
        .order_by(Role.is_system.desc(), Role.name)
    )
    result = await db.execute(stmt)
    roles = result.scalars().all()

    response_roles = []
    for r in roles:
        perms = [rp.permission for rp in r.role_permissions if rp.permission]
        response_roles.append(
            RoleRead(
                id=r.id,
                organization_id=r.organization_id,
                slug=r.slug,
                name=r.name,
                description=r.description,
                is_system=r.is_system,
                permissions=[PermissionRead.model_validate(p) for p in perms],
            )
        )
    return response_roles


@router.post(
    "/roles",
    response_model=RoleRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("role.create"))],
)
async def create_custom_role(
    payload: RoleCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("role.create")),
    db: AsyncSession = Depends(get_db_session),
):
    # Check if slug exists in org
    existing_stmt = select(Role).where(
        Role.organization_id == context.user.organization_id,
        Role.slug == payload.slug,
        Role.deleted_at.is_(None),
    )
    if (await db.execute(existing_stmt)).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Role with slug '{payload.slug}' already exists in your organization",
        )

    # Create role
    new_role = Role(
        organization_id=context.user.organization_id,
        slug=payload.slug,
        name=payload.name,
        description=payload.description,
        is_system=False,
    )
    db.add(new_role)
    await db.flush()

    # Assign permissions
    assigned_permissions = []
    if payload.permission_codes:
        perm_stmt = select(Permission).where(Permission.code.in_(payload.permission_codes))
        permissions = (await db.execute(perm_stmt)).scalars().all()
        for p in permissions:
            rp = RolePermission(role_id=new_role.id, permission_id=p.id)
            db.add(rp)
            assigned_permissions.append(PermissionRead.model_validate(p))

    await db.commit()
    await db.refresh(new_role)

    return RoleRead(
        id=new_role.id,
        organization_id=new_role.organization_id,
        slug=new_role.slug,
        name=new_role.name,
        description=new_role.description,
        is_system=new_role.is_system,
        permissions=assigned_permissions,
    )
