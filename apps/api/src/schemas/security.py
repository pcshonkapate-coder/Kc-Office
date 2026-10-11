from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    actor_email: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    scopes: List[str] = Field(default_factory=list)
    expires_in_days: Optional[int] = 90


class ApiKeyCreatedResponse(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    plain_secret_key: str  # ONLY RETURNED ONCE UPON CREATION
    scopes: List[str]
    expires_at: Optional[datetime] = None


class ApiKeyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    key_prefix: str
    scopes: List[str]
    is_active: bool
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime


class WebhookCreate(BaseModel):
    url: str = Field(..., min_length=10)
    events: List[str]
    description: Optional[str] = None


class WebhookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    url: str
    events: List[str]
    is_active: bool
    description: Optional[str] = None
    created_at: datetime


class SessionRead(BaseModel):
    session_id: str
    user_id: uuid.UUID
    user_email: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: str
    expires_at: str
    is_current: bool = False


class LoginHistoryRead(BaseModel):
    id: uuid.UUID
    actor_email: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    action: str
    status: str
    created_at: datetime

