from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user_flexible
from app.models.auth import User
from app.models.system import AuditLog, Notification
from app.schemas.system import AuditLogResponse, NotificationResponse

router = APIRouter()


# ==================== AUDIT LOGS ====================
@router.get("/audit/logs", response_model=List[AuditLogResponse], status_code=status.HTTP_200_OK, tags=["System Audit"])
def get_audit_logs(
    action: Optional[str] = Query(None),
    entity_name: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_name:
        query = query.filter(AuditLog.entity_name == entity_name)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    response = []
    for l in logs:
        user = db.query(User).filter(User.id == l.user_id).first() if l.user_id else None
        u_name = user.full_name if user else "System"
        response.append(
            AuditLogResponse(
                id=l.id,
                user_id=l.user_id,
                user_name=u_name,
                action=l.action,
                entity_name=l.entity_name,
                entity_id=l.entity_id,
                old_values=l.old_values,
                new_values=l.new_values,
                ip_address=l.ip_address,
                user_agent=l.user_agent,
                created_at=l.created_at,
            )
        )
    return response


# ==================== NOTIFICATIONS ====================
@router.get("/system/notifications", response_model=List[NotificationResponse], status_code=status.HTTP_200_OK, tags=["Notifications"])
def get_user_notifications(
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).limit(30).all()


# ==================== GLOBAL SEARCH ====================
@router.get("/search", status_code=status.HTTP_200_OK, tags=["Global Search"])
def global_search(
    q: str = Query(..., min_length=2, description="Search term across entities"),
    limit_per_entity: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    from app.services.search_service import GlobalSearchService
    search_service = GlobalSearchService(db)
    return search_service.search(query_str=q, limit_per_entity=limit_per_entity)


# ==================== ACTIVITY TIMELINE ====================
@router.get("/timeline/{entity_type}/{entity_id}", status_code=status.HTTP_200_OK, tags=["Activity Timeline"])
def get_entity_timeline(
    entity_type: str,
    entity_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
):
    from app.services.activity_service import ActivityService
    activity_service = ActivityService(db)
    events = activity_service.get_timeline(entity_type=entity_type, entity_id=entity_id, limit=limit, offset=offset)
    return [
        {
            "id": e.id,
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "event_type": e.event_type,
            "description": e.description,
            "user_id": e.user_id,
            "metadata": e.metadata_json,
            "created_at": e.created_at,
        }
        for e in events
    ]

