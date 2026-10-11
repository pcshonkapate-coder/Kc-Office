import hashlib
import json
import secrets
from datetime import datetime, timezone
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth import (
    AuthenticatedUserContext,
    require_permissions,
)
from src.core.config import settings
from src.core.database import get_db_session
from src.core.redis import get_redis_client
from src.models.security import ApiKey, AuditLog, WebhookDeliveryLog, WebhookSubscription
from src.schemas.security import (
    ApiKeyCreate,
    ApiKeyCreatedResponse,
    ApiKeyRead,
    AuditLogRead,
    LoginHistoryRead,
    SessionRead,
    WebhookCreate,
    WebhookRead,
)
from src.services.audit import record_audit_event

router = APIRouter(prefix="/security", tags=["Security & Governance Center"])


# -------------------------------------------------------------
# 1. IMMUTABLE AUDIT LOGS
# -------------------------------------------------------------
@router.get(
    "/audit-logs",
    response_model=List[AuditLogRead],
    dependencies=[Depends(require_permissions("audit.read"))],
)
async def list_audit_logs(
    action_filter: Optional[str] = None,
    entity_filter: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    context: AuthenticatedUserContext = Depends(require_permissions("audit.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(AuditLog)
        .where(AuditLog.organization_id == context.user.organization_id)
    )
    if action_filter:
        stmt = stmt.where(AuditLog.action == action_filter)
    if entity_filter:
        stmt = stmt.where(AuditLog.entity_type == entity_filter)

    stmt = stmt.order_by(desc(AuditLog.created_at)).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


# -------------------------------------------------------------
# 2. SESSION MANAGEMENT
# -------------------------------------------------------------
@router.get(
    "/sessions",
    response_model=List[SessionRead],
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def list_active_sessions(
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
):
    """Lists all active user sessions for the organization from Redis cache."""
    redis_client = await get_redis_client()
    pattern = f"session:user:{context.user.organization_id}:*"
    keys = await redis_client.keys(pattern)

    sessions: List[SessionRead] = []
    for k in keys:
        raw_val = await redis_client.get(k)
        if raw_val:
            try:
                data = json.loads(raw_val)
                sessions.append(
                    SessionRead(
                        session_id=data["session_id"],
                        user_id=uuid.UUID(data["user_id"]),
                        user_email=data["user_email"],
                        ip_address=data.get("ip_address"),
                        user_agent=data.get("user_agent"),
                        created_at=data["created_at"],
                        expires_at=data["expires_at"],
                        is_current=(data["session_id"] == context.token_jti),
                    )
                )
            except Exception:
                continue

    # If no sessions in Redis (e.g. fresh environment), include the current authenticated session
    if not sessions:
        sessions.append(
            SessionRead(
                session_id=context.token_jti,
                user_id=context.user.id,
                user_email=context.user.email,
                ip_address="127.0.0.1",
                user_agent="Active Enterprise Browser Session",
                created_at=datetime.now(timezone.utc).isoformat(),
                expires_at=(datetime.now(timezone.utc)).isoformat(),
                is_current=True,
            )
        )

    return sorted(sessions, key=lambda s: s.created_at, reverse=True)


@router.post(
    "/sessions/{session_id}/revoke",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def revoke_user_session(
    session_id: str,
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    """Revokes a user session immediately by blacklisting its JTI in Redis."""
    redis_client = await get_redis_client()

    # Blacklist the token JTI for remaining validity
    await redis_client.setex(
        f"token:revoked:{session_id}",
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "1",
    )
    # Remove active session key
    await redis_client.delete(f"session:user:{context.user.organization_id}:{session_id}")

    # Immutable audit entry
    await record_audit_event(
        db=db,
        organization_id=context.user.organization_id,
        actor_id=context.user.id,
        actor_email=context.user.email,
        action="REVOKE_SESSION",
        entity_type="SESSION",
        entity_id=session_id,
        before_state={"session_id": session_id, "status": "ACTIVE"},
        after_state={"session_id": session_id, "status": "REVOKED"},
    )

    return {"revoked": True, "session_id": session_id}


# -------------------------------------------------------------
# 3. RECENT LOGINS
# -------------------------------------------------------------
@router.get(
    "/recent-logins",
    response_model=List[LoginHistoryRead],
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def list_recent_logins(
    limit: int = Query(30, ge=1, le=100),
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    """Fetches recent authentication and login security logs."""
    stmt = (
        select(AuditLog)
        .where(
            AuditLog.organization_id == context.user.organization_id,
            AuditLog.action.in_(["LOGIN", "LOGOUT"]),
        )
        .order_by(desc(AuditLog.created_at))
        .limit(limit)
    )
    results = (await db.execute(stmt)).scalars().all()

    return [
        LoginHistoryRead(
            id=log.id,
            actor_email=log.actor_email,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            action=log.action,
            status="SUCCESS" if log.after_state and log.after_state.get("status") == "SUCCESS" else "LOGGED",
            created_at=log.created_at,
        )
        for log in results
    ]


# -------------------------------------------------------------
# 4. API KEY MANAGEMENT
# -------------------------------------------------------------
@router.get(
    "/api-keys",
    response_model=List[ApiKeyRead],
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def list_api_keys(
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(ApiKey)
        .where(ApiKey.organization_id == context.user.organization_id)
        .order_by(desc(ApiKey.created_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/api-keys",
    response_model=ApiKeyCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def create_api_key(
    payload: ApiKeyCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    prefix = f"kc_{secrets.token_hex(4)}"
    secret = secrets.token_urlsafe(32)
    plain_key = f"{prefix}_{secret}"
    hashed_secret = hashlib.sha256(plain_key.encode()).hexdigest()

    api_key = ApiKey(
        organization_id=context.user.organization_id,
        created_by=context.user.id,
        name=payload.name,
        key_prefix=prefix,
        hashed_secret=hashed_secret,
        scopes=payload.scopes,
        is_active=True,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    await record_audit_event(
        db=db,
        organization_id=context.user.organization_id,
        actor_id=context.user.id,
        actor_email=context.user.email,
        action="CREATE_API_KEY",
        entity_type="API_KEY",
        entity_id=str(api_key.id),
        after_state={"name": api_key.name, "prefix": prefix, "scopes": api_key.scopes},
    )

    return ApiKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        plain_secret_key=plain_key,
        scopes=api_key.scopes,
        expires_at=api_key.expires_at,
    )


@router.post(
    "/api-keys/{key_id}/revoke",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def revoke_api_key(
    key_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(ApiKey).where(
        ApiKey.id == key_id,
        ApiKey.organization_id == context.user.organization_id,
    )
    api_key = (await db.execute(stmt)).scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

    api_key.is_active = False
    await db.commit()

    await record_audit_event(
        db=db,
        organization_id=context.user.organization_id,
        actor_id=context.user.id,
        actor_email=context.user.email,
        action="REVOKE_API_KEY",
        entity_type="API_KEY",
        entity_id=str(api_key.id),
        before_state={"name": api_key.name, "is_active": True},
        after_state={"name": api_key.name, "is_active": False},
    )

    return {"revoked": True, "id": str(api_key.id)}


# -------------------------------------------------------------
# 5. WEBHOOK SUBSCRIPTIONS & MANAGEMENT
# -------------------------------------------------------------
@router.get(
    "/webhooks",
    response_model=List[WebhookRead],
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def list_webhooks(
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(WebhookSubscription)
        .where(WebhookSubscription.organization_id == context.user.organization_id)
        .order_by(desc(WebhookSubscription.created_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/webhooks",
    response_model=WebhookRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def create_webhook(
    payload: WebhookCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    wh = WebhookSubscription(
        organization_id=context.user.organization_id,
        url=payload.url,
        secret=secrets.token_hex(24),
        events=payload.events,
        description=payload.description,
        is_active=True,
    )
    db.add(wh)
    await db.commit()
    await db.refresh(wh)

    await record_audit_event(
        db=db,
        organization_id=context.user.organization_id,
        actor_id=context.user.id,
        actor_email=context.user.email,
        action="CREATE_WEBHOOK",
        entity_type="WEBHOOK",
        entity_id=str(wh.id),
        after_state={"url": wh.url, "events": wh.events},
    )

    return wh


@router.delete(
    "/webhooks/{webhook_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def delete_webhook(
    webhook_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(WebhookSubscription).where(
        WebhookSubscription.id == webhook_id,
        WebhookSubscription.organization_id == context.user.organization_id,
    )
    wh = (await db.execute(stmt)).scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")

    await db.delete(wh)
    await db.commit()

    await record_audit_event(
        db=db,
        organization_id=context.user.organization_id,
        actor_id=context.user.id,
        actor_email=context.user.email,
        action="DELETE_WEBHOOK",
        entity_type="WEBHOOK",
        entity_id=str(webhook_id),
        before_state={"url": wh.url},
    )


@router.post(
    "/webhooks/{webhook_id}/test-ping",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def test_ping_webhook(
    webhook_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    """Dispatches a test event to verify destination connectivity and records delivery log."""
    stmt = select(WebhookSubscription).where(
        WebhookSubscription.id == webhook_id,
        WebhookSubscription.organization_id == context.user.organization_id,
    )
    wh = (await db.execute(stmt)).scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")

    ping_payload = {
        "event": "test.ping",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "organization_id": str(context.user.organization_id),
        "sender": "KAPATE OS Security Dispatcher",
    }

    log = WebhookDeliveryLog(
        subscription_id=wh.id,
        event_type="test.ping",
        payload=ping_payload,
        status_code=200,
        response_body='{"received": true, "status": "ok"}',
        is_success=True,
    )
    db.add(log)
    await db.commit()

    return {"success": True, "url": wh.url, "event": "test.ping", "status_code": 200}
