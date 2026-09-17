from sqlalchemy.orm import Session
from app.models.system import Notification
from app.services.notifications.provider_interface import NotificationProvider
from app.core.logging import logger

class InAppNotificationProvider(NotificationProvider):
    def send(self, db: Session, user_id: str, title: str, message: str, notification_type: str, link: str = None) -> bool:
        try:
            notif = Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                link=link
            )
            db.add(notif)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to send in-app notification: {e}")
            db.rollback()
            return False
