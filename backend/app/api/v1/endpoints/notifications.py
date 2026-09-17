from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.models.system import Notification, NotificationPreference
from app.schemas.notifications import NotificationResponse, NotificationPreferencesUpdate

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/preferences")
def update_preferences(
    data: NotificationPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    for pref_data in data.preferences:
        pref = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == current_user.id,
            NotificationPreference.event_category == pref_data.event_category
        ).first()
        
        if pref:
            pref.in_app_enabled = pref_data.in_app_enabled
            pref.email_enabled = pref_data.email_enabled
        else:
            new_pref = NotificationPreference(
                user_id=current_user.id,
                event_category=pref_data.event_category,
                in_app_enabled=pref_data.in_app_enabled,
                email_enabled=pref_data.email_enabled
            )
            db.add(new_pref)
            
    db.commit()
    return {"status": "success", "message": "Preferences updated"}
