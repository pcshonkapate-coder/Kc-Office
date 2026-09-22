from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: str = Field(..., description="Corporate email or Kapate ID", examples=["admin@kapateconsultancy.in"])
    password: str = Field(..., min_length=6, examples=["KapateOS@2026!"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: "UserSummary"


class UserSummary(BaseModel):
    id: str
    email: str
    full_name: str
    name: Optional[str] = None
    role: Optional[str] = None
    kapateId: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    roles: List[str] = Field(default_factory=list)
    permissions: List[str] = Field(default_factory=list)
