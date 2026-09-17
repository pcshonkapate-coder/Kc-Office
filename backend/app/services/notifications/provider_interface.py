from abc import ABC, abstractmethod
from typing import Dict, Any
from sqlalchemy.orm import Session

class NotificationProvider(ABC):
    @abstractmethod
    def send(self, db: Session, user_id: str, title: str, message: str, notification_type: str, link: str = None) -> bool:
        """
        Send a notification to a specific user.
        """
        pass
