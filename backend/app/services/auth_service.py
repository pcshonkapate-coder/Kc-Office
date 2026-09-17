from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.models.auth import User
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.schemas.auth import TokenResponse, UserSummary


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def authenticate_user(self, email: str, password: str) -> User:
        user = self.user_repo.get_by_email(email)
        if not user:
            raise UnauthorizedException("Invalid email or password.")
        if not user.is_active:
            raise UnauthorizedException("Account has been deactivated.")
        if not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password.")

        # Update last login timestamp
        user.last_login_at = datetime.now(timezone.utc)
        self.db.commit()
        return user

    def create_user_tokens(self, user: User) -> TokenResponse:
        access_token = create_access_token(subject=user.id)
        roles = self.user_repo.get_roles(user)
        permissions = self.user_repo.get_permissions(user)

        # Superadmin inherits all permissions implicitly
        if "superadmin" in roles and "*" not in permissions:
            permissions.append("*")

        user_summary = UserSummary(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            roles=roles,
            permissions=permissions
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            user=user_summary
        )
