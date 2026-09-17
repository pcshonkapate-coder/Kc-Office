from typing import Optional, Any, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    action: str
    entity_name: str
    entity_id: str
    old_values: Optional[Any] = None
    new_values: Optional[Any] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    notification_type: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    uploaded_by_user_id: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
