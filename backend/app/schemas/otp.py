from typing import Optional
from enum import Enum
from pydantic import BaseModel, EmailStr, Field


class OTPPurpose(str, Enum):
    LOGIN = "LOGIN"
    VERIFY_IDENTITY = "VERIFY_IDENTITY"
    ATTENDANCE = "ATTENDANCE"
    PASSWORD_RESET = "PASSWORD_RESET"


class OTPRequestPayload(BaseModel):
    identifier: EmailStr = Field(..., description="Employee work email address", example="admin@kapateconsultancy.in")
    purpose: OTPPurpose = Field(default=OTPPurpose.LOGIN, description="Purpose of OTP issuance")


def mask_identifier(identifier: str) -> str:
    """Masks email or phone identifier for secure display, e.g. a***n@domain.com"""
    if "@" in identifier:
        parts = identifier.split("@")
        user, domain = parts[0], parts[1]
        if len(user) <= 2:
            masked_user = user[0] + "*"
        else:
            masked_user = user[0] + "*" * (len(user) - 2) + user[-1]
        return f"{masked_user}@{domain}"
    elif len(identifier) > 4:
        return identifier[:2] + "*" * (len(identifier) - 4) + identifier[-2:]
    return identifier


class OTPRequestResponse(BaseModel):
    success: bool = True
    message: str
    identifier: str
    masked_identifier: Optional[str] = None
    delivery_channel: str = "email"
    purpose: str
    expires_in_seconds: int
    cooldown_seconds: int
    dev_otp: Optional[str] = Field(None, description="Deprecated. Real-time OTP is never returned in API payloads.")


class OTPVerifyPayload(BaseModel):
    identifier: EmailStr = Field(..., description="Employee work email address", example="admin@kapateconsultancy.in")
    otp_code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$", description="6-digit OTP verification code", example="123456")
    purpose: OTPPurpose = Field(default=OTPPurpose.LOGIN, description="Purpose of OTP verification")


class OTPResendPayload(BaseModel):
    identifier: EmailStr = Field(..., description="Employee work email address", example="admin@kapateconsultancy.in")
    purpose: OTPPurpose = Field(default=OTPPurpose.LOGIN, description="Purpose of OTP resend")
