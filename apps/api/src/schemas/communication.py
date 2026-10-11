from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class ChannelCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    channel_type: str = Field("GENERAL", examples=["GENERAL", "PROJECT", "DIRECT"])
    project_id: Optional[uuid.UUID] = None
    is_private: bool = False


class ChannelRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    name: str
    channel_type: str
    is_private: bool
    created_at: datetime


class MessageCreate(BaseModel):
    channel_id: uuid.UUID
    content: str = Field(..., min_length=1)
    attachments: List[str] = []
    mentions: List[str] = []


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    channel_id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    attachments: List[str]
    mentions: List[str]
    created_at: datetime
    sender_name: Optional[str] = None


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    recipient_id: uuid.UUID
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    notification_type: str
    created_at: datetime
