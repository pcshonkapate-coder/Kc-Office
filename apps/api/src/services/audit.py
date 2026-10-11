from typing import Any, Dict, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.security import AuditLog


async def record_audit_event(
    db: AsyncSession,
    organization_id: uuid.UUID,
    actor_email: str,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    before_state: Optional[Dict[str, Any]] = None,
    after_state: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    actor_id: Optional[uuid.UUID] = None,
) -> AuditLog:
    """Writes an immutable audit log entry for database/security actions."""
    log = AuditLog(
        organization_id=organization_id,
        actor_id=actor_id,
        actor_email=actor_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_state=before_state,
        after_state=after_state,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log)
    await db.commit()
    return log
