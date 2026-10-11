import hashlib
import secrets
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.dependencies.auth import AuthenticatedUserContext, get_current_user_context
from src.core.config import settings
from src.core.database import get_db_session
from src.core.redis import get_redis_client
from src.core.security import create_access_token, verify_password
from src.models.identity import Organization, Role, RolePermission, User, UserRole
from src.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Identity & Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db_session),
):
    # Verify Tenant exists and is active
    org_stmt = select(Organization).where(
        Organization.slug == payload.organization_slug,
        Organization.is_active.is_(True),
        Organization.deleted_at.is_(None),
    )
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ERR_TENANT_NOT_FOUND", "message": "Organization not found or inactive"},
        )

    # Fetch User
    user_stmt = (
        select(User)
        .options(
            selectinload(User.user_roles)
            .selectinload(UserRole.role)
            .selectinload(Role.role_permissions)
            .selectinload(RolePermission.permission)
        )
        .where(
            User.organization_id == org.id,
            User.email == payload.email,
            User.deleted_at.is_(None),
        )
    )
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ERR_INVALID_CREDENTIALS", "message": "Invalid email or password"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ERR_ACCOUNT_DISABLED", "message": "Account has been deactivated"},
        )

    # Extract roles and permissions
    roles = []
    permissions = set()
    for ur in user.user_roles:
        if ur.role and not ur.role.deleted_at:
            roles.append(ur.role.slug)
            for rp in ur.role.role_permissions:
                if rp.permission:
                    permissions.add(rp.permission.code)

    # Issue Access Token
    access_token, jti = create_access_token(
        subject=str(user.id),
        organization_id=str(org.id),
        roles=roles,
        permissions=list(permissions),
    )

    # Generate Refresh Token and store in Redis
    refresh_token = secrets.token_urlsafe(64)
    refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    redis_client = await get_redis_client()

    refresh_expiry_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    await redis_client.setex(
        f"session:refresh:{refresh_hash}",
        refresh_expiry_seconds,
        f"{user.id}|{org.id}",
    )

    # Set secure HttpOnly cookie for Refresh Token
    response.set_cookie(
        key="kapate_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=refresh_expiry_seconds,
        path="/api/v1/auth",
    )

    # Update Last Login
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    # Store active session in Redis for Session Management
    import json
    from datetime import timedelta
    from src.services.audit import record_audit_event

    ip_addr = request.client.host if request.client else "127.0.0.1"
    ua_str = request.headers.get("user-agent", "Unknown Client")
    session_payload = {
        "session_id": jti,
        "user_id": str(user.id),
        "user_email": user.email,
        "ip_address": ip_addr,
        "user_agent": ua_str,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).isoformat(),
    }
    await redis_client.setex(
        f"session:user:{org.id}:{jti}",
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        json.dumps(session_payload),
    )

    # Immutably record in Audit Log
    await record_audit_event(
        db=db,
        organization_id=org.id,
        actor_id=user.id,
        actor_email=user.email,
        action="LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        ip_address=ip_addr,
        user_agent=ua_str,
        after_state={"status": "SUCCESS", "roles": roles},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        organization_id=org.id,
        roles=roles,
        permissions=list(permissions),
    )



@router.post("/refresh", response_model=TokenResponse)
async def refresh_session(
    request: Request,
    response: Response,
    body: RefreshTokenRequest | None = None,
    db: AsyncSession = Depends(get_db_session),
):
    token = request.cookies.get("kapate_refresh_token") or (body.refresh_token if body else None)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ERR_NO_REFRESH_TOKEN", "message": "No refresh token found"},
        )

    refresh_hash = hashlib.sha256(token.encode()).hexdigest()
    redis_client = await get_redis_client()
    session_data = await redis_client.get(f"session:refresh:{refresh_hash}")

    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ERR_SESSION_EXPIRED", "message": "Session has expired or was revoked"},
        )

    user_id_str, org_id_str = session_data.split("|")
    user_stmt = (
        select(User)
        .options(
            selectinload(User.user_roles)
            .selectinload(UserRole.role)
            .selectinload(Role.role_permissions)
            .selectinload(RolePermission.permission)
        )
        .where(
            User.id == uuid.UUID(user_id_str),
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
    )
    user = (await db.execute(user_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User unavailable")

    # Rotate refresh token
    await redis_client.delete(f"session:refresh:{refresh_hash}")
    new_refresh_token = secrets.token_urlsafe(64)
    new_refresh_hash = hashlib.sha256(new_refresh_token.encode()).hexdigest()
    refresh_expiry_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400

    await redis_client.setex(
        f"session:refresh:{new_refresh_hash}",
        refresh_expiry_seconds,
        f"{user.id}|{org_id_str}",
    )

    response.set_cookie(
        key="kapate_refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=refresh_expiry_seconds,
        path="/api/v1/auth",
    )

    roles = []
    permissions = set()
    for ur in user.user_roles:
        if ur.role and not ur.role.deleted_at:
            roles.append(ur.role.slug)
            for rp in ur.role.role_permissions:
                if rp.permission:
                    permissions.add(rp.permission.code)

    new_access_token, _ = create_access_token(
        subject=str(user.id),
        organization_id=org_id_str,
        roles=roles,
        permissions=list(permissions),
    )

    return TokenResponse(
        access_token=new_access_token,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        organization_id=uuid.UUID(org_id_str),
        roles=roles,
        permissions=list(permissions),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    redis_client = await get_redis_client()

    # Blacklist current Access Token JTI
    await redis_client.setex(
        f"token:revoked:{context.token_jti}",
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "1",
    )

    # Delete active session record
    await redis_client.delete(f"session:user:{context.user.organization_id}:{context.token_jti}")

    # Invalidate Refresh Token session if present
    refresh_token = request.cookies.get("kapate_refresh_token")
    if refresh_token:
        refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        await redis_client.delete(f"session:refresh:{refresh_hash}")

    response.delete_cookie("kapate_refresh_token", path="/api/v1/auth")

    # Audit logout
    from src.services.audit import record_audit_event
    await record_audit_event(
        db=db,
        organization_id=context.user.organization_id,
        actor_id=context.user.id,
        actor_email=context.user.email,
        action="LOGOUT",
        entity_type="USER",
        entity_id=str(context.user.id),
        ip_address=request.client.host if request.client else "127.0.0.1",
        user_agent=request.headers.get("user-agent", "Unknown Client"),
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)



@router.get("/me")
async def get_my_profile(
    context: AuthenticatedUserContext = Depends(get_current_user_context),
):
    return {
        "id": context.user.id,
        "email": context.user.email,
        "full_name": context.user.full_name,
        "organization_id": context.user.organization_id,
        "roles": context.roles,
        "permissions": list(context.permissions),
        "is_active": context.user.is_active,
    }
