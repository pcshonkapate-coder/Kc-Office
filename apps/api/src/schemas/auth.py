import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    organization_slug: str = Field(..., min_length=2, max_length=64, examples=["kapate-consultancy"])
    email: EmailStr = Field(..., examples=["admin@kapateconsultancy.com"])
    password: str = Field(..., min_length=8, examples=["SecureP@ssw0rd2026!"])


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="Optional if provided via HttpOnly cookie")


class UserSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    email: str
    full_name: str
    organization_id: uuid.UUID
    roles: List[str]
    permissions: List[str]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user_id: uuid.UUID
    email: str
    full_name: str
    organization_id: uuid.UUID
    roles: List[str]
    permissions: List[str]
