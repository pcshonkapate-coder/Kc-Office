from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    role_names: List[str] = ["consultant"]


class UserRead(UserBase):
    id: str
    is_verified: bool
    last_login_at: Optional[datetime] = None
    roles: List[str] = []
    permissions: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
