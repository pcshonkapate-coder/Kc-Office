from sqlalchemy.orm import Session
from app.models.system import NotificationPreference
from app.services.notifications.in_app_provider import InAppNotificationProvider
from app.services.notifications.email_provider import EmailNotificationProvider

class NotificationDispatcher:
    def __init__(self):
        self.in_app_provider = InAppNotificationProvider()
        self.email_provider = EmailNotificationProvider()
        
    def dispatch(self, db: Session, user_id: str, event_category: str, title: str, message: str, notification_type: str = "info", link: str = None):
        """
        Looks up user preferences for the given event_category and routes 
        the notification to the appropriate channels.
        """
        # Default behavior if no preference is set: In-App is ON, Email is OFF.
        in_app_enabled = True
        email_enabled = False
        
        pref = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id,
            NotificationPreference.event_category == event_category
        ).first()
        
        if pref:
            in_app_enabled = pref.in_app_enabled
            email_enabled = pref.email_enabled
            
        if in_app_enabled:
            self.in_app_provider.send(db, user_id, title, message, notification_type, link)
            
        if email_enabled:
            self.email_provider.send(db, user_id, title, message, notification_type, link)
