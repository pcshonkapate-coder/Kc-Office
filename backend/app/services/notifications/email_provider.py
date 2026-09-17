from sqlalchemy.orm import Session
from app.services.notifications.provider_interface import NotificationProvider
from app.core.logging import logger
from app.models.auth import User

class EmailNotificationProvider(NotificationProvider):
    def send(self, db: Session, user_id: str, title: str, message: str, notification_type: str, link: str = None) -> bool:
        try:
            # Look up user email
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
                
            email = user.email
            
            # STUB: In production, integrate SendGrid or AWS SES here.
            # Example:
            # sendgrid_client.send(
            #     to_emails=email,
            #     subject=title,
            #     html_content=f"<html><body><h1>{title}</h1><p>{message}</p><a href='{link}'>View here</a></body></html>"
            # )
            
            logger.info(f"Stubbed Email Sent to {email}: [{title}] {message}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            return False
