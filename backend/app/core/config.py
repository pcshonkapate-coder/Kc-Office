from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "Kapate OS"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "kapate-os-dev-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "sqlite:///./kapate_os.db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    # Superadmin Seed Defaults
    FIRST_SUPERADMIN_EMAIL: str = "admin@kapateconsultancy.com"
    FIRST_SUPERADMIN_PASSWORD: str = "KapateOS@2026!"
    FIRST_SUPERADMIN_NAME: str = "Kapate Master Admin"

    # Real-Time SMTP Email Dispatch
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_TIMEOUT: int = 10
    EMAILS_FROM_EMAIL: str = "security@kapateconsultancy.com"
    EMAILS_FROM_NAME: str = "Kapate OS Security"

    # User Onboarding & OTP Settings
    ALLOW_SELF_REGISTRATION_OTP: bool = True
    DEFAULT_OTP_USER_ROLE: str = "consultant"


settings = Settings()
