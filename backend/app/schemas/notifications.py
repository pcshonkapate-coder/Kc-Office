from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    link: Optional[str]
    is_read: bool
    notification_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationPreferenceSchema(BaseModel):
    event_category: str
    in_app_enabled: bool
    email_enabled: bool

class NotificationPreferencesUpdate(BaseModel):
    preferences: List[NotificationPreferenceSchema]
