from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., example="admin@kapateconsultancy.com")
    password: str = Field(..., min_length=6, example="KapateOS@2026!")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: "UserSummary"


class UserSummary(BaseModel):
    id: str
    email: str
    full_name: str
    roles: List[str]
    permissions: List[str]
