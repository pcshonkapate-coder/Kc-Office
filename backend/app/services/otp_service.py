import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.models.auth import User
from app.models.otp import OTPToken
from app.models.workforce import PersonProfile
from app.repositories.user_repository import UserRepository
from app.core.config import settings
from app.core.exceptions import UnauthorizedException, NotFoundException, BadRequestException
from app.core.logging import logger
from app.schemas.otp import OTPPurpose, OTPRequestResponse, OTPVerifyPayload, mask_identifier
from app.schemas.auth import TokenResponse
from app.services.auth_service import AuthService
from app.services.email_service import EmailService


class OTPService:
    OTP_EXPIRY_SECONDS = 300  # 5 minutes
    COOLDOWN_SECONDS = 60     # 1 minute

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.auth_service = AuthService(db)

    @staticmethod
    def _hash_otp(code: str, identifier: str) -> str:
        """Hash OTP code salted with identifier and application secret key."""
        salt = f"{identifier}:{settings.SECRET_KEY}"
        return hashlib.sha256(f"{code}:{salt}".encode("utf-8")).hexdigest()

    @staticmethod
    def _generate_code() -> str:
        """Generate a cryptographically secure 6-digit numeric string."""
        return f"{secrets.randbelow(900000) + 100000:06d}"

    def request_otp(self, identifier: str, purpose: OTPPurpose = OTPPurpose.LOGIN) -> OTPRequestResponse:
        """
        Issue a new 6-digit OTP for the given employee identifier (email).
        Enforces cooldown and invalidates previous active tokens.
        """
        clean_email = identifier.strip().lower()
        now = datetime.now(timezone.utc)

        # 1. Check if user or workforce profile exists
        user = self.user_repo.get_by_email(clean_email)
        profile = None
        user_name = None
        if user:
            user_name = user.full_name
        else:
            profile = self.db.execute(
                select(PersonProfile).where(PersonProfile.email == clean_email, PersonProfile.is_deleted == False)
            ).scalar_one_or_none()

            if profile:
                user_name = profile.name
            elif not getattr(settings, "ALLOW_SELF_REGISTRATION_OTP", True):
                raise NotFoundException(f"No employee or user account found for '{clean_email}'.")

        # 2. Check cooldown rate limiting
        recent_token = self.db.execute(
            select(OTPToken)
            .where(
                OTPToken.identifier == clean_email,
                OTPToken.purpose == purpose.value,
                OTPToken.is_used == False
            )
            .order_by(desc(OTPToken.created_at))
        ).scalars().first()

        if recent_token and recent_token.created_at:
            created_at = recent_token.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            elapsed = (now - created_at).total_seconds()
            if elapsed < self.COOLDOWN_SECONDS:
                remaining = int(self.COOLDOWN_SECONDS - elapsed)
                raise BadRequestException(f"Please wait {remaining} seconds before requesting a new OTP.")

        # 3. Invalidate older unused tokens for this identifier and purpose
        old_tokens = self.db.execute(
            select(OTPToken).where(
                OTPToken.identifier == clean_email,
                OTPToken.purpose == purpose.value,
                OTPToken.is_used == False
            )
        ).scalars().all()
        for t in old_tokens:
            t.is_used = True

        # 4. Generate new OTP
        raw_code = self._generate_code()
        hashed_code = self._hash_otp(raw_code, clean_email)
        expires_at = now + timedelta(seconds=self.OTP_EXPIRY_SECONDS)

        otp_record = OTPToken(
            user_id=user.id if user else None,
            identifier=clean_email,
            otp_code_hash=hashed_code,
            purpose=purpose.value,
            expires_at=expires_at,
            is_used=False,
            attempts_count=0,
            max_attempts=5
        )
        self.db.add(otp_record)
        self.db.commit()
        self.db.refresh(otp_record)

        # 5. Dispatch Real-Time Email via SMTP
        logger.info(f"[OTP Service] Generated OTP for '{clean_email}' (Purpose: {purpose.value}). Dispatching real-time email.")
        email_sent = EmailService.send_otp_email(
            to_email=clean_email,
            otp_code=raw_code,
            employee_name=user_name,
            purpose=purpose.value
        )

        masked = mask_identifier(clean_email)
        is_smtp_configured = bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)
        dev_code = raw_code if (not is_smtp_configured or settings.DEBUG or settings.ENVIRONMENT == "development") else None

        msg = (
            f"A 6-digit verification code has been dispatched to {masked}."
            if is_smtp_configured
            else f"Verification code: {raw_code} (SMTP not configured in backend/.env)"
        )

        return OTPRequestResponse(
            success=True,
            message=msg,
            identifier=clean_email,
            masked_identifier=masked,
            delivery_channel="email" if is_smtp_configured else "console",
            purpose=purpose.value,
            expires_in_seconds=self.OTP_EXPIRY_SECONDS,
            cooldown_seconds=self.COOLDOWN_SECONDS,
            dev_otp=dev_code
        )

    def verify_otp(self, payload: OTPVerifyPayload) -> TokenResponse:
        """
        Verify the provided 6-digit OTP code and authenticate the employee.
        Returns full JWT token payload.
        """
        clean_email = payload.identifier.strip().lower()
        now = datetime.now(timezone.utc)

        # 1. Fetch latest active OTP record
        token_record = self.db.execute(
            select(OTPToken)
            .where(
                OTPToken.identifier == clean_email,
                OTPToken.purpose == payload.purpose.value,
                OTPToken.is_used == False
            )
            .order_by(desc(OTPToken.created_at))
        ).scalars().first()

        if not token_record:
            raise UnauthorizedException("No active OTP request found. Please request a new code.")

        # 2. Check maximum retry attempts
        if token_record.attempts_count >= token_record.max_attempts:
            token_record.is_used = True
            self.db.commit()
            raise UnauthorizedException("Too many invalid attempts. This OTP has been invalidated. Please request a new code.")

        # 3. Check expiration
        expires_at = token_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now > expires_at:
            token_record.is_used = True
            self.db.commit()
            raise UnauthorizedException("The OTP code has expired. Please request a new code.")

        # 4. Validate OTP Hash
        provided_hash = self._hash_otp(payload.otp_code.strip(), clean_email)
        if provided_hash != token_record.otp_code_hash:
            token_record.attempts_count += 1
            remaining = token_record.max_attempts - token_record.attempts_count
            self.db.commit()
            raise UnauthorizedException(f"Invalid verification code. {remaining} attempt(s) remaining.")

        # 5. Success! Mark OTP as used
        token_record.is_used = True

        # 6. Retrieve or ensure User record
        user = self.user_repo.get_by_email(clean_email)
        if not user:
            # If a PersonProfile exists without user_id, auto-link to a new user
            profile = self.db.execute(
                select(PersonProfile).where(PersonProfile.email == clean_email, PersonProfile.is_deleted == False)
            ).scalar_one_or_none()

            from app.core.security import get_password_hash
            if profile:
                user = User(
                    email=clean_email,
                    full_name=profile.name,
                    phone=profile.phone,
                    avatar_url=profile.avatar_url,
                    hashed_password=get_password_hash(secrets.token_urlsafe(16)),
                    is_active=True,
                    is_verified=True
                )
                self.db.add(user)
                self.db.flush()
                profile.user_id = user.id

                # Assign appropriate default role based on profile type
                role_name = "engineer"
                if profile.profile_type == "intern":
                    role_name = "intern"
                elif profile.profile_type == "freelancer":
                    role_name = "freelancer"
                
                self.user_repo.assign_role(user, role_name)
            elif getattr(settings, "ALLOW_SELF_REGISTRATION_OTP", True):
                # Auto-provision verified user account
                default_name = clean_email.split("@")[0].replace(".", " ").replace("_", " ").title()
                user = User(
                    email=clean_email,
                    full_name=default_name,
                    hashed_password=get_password_hash(secrets.token_urlsafe(16)),
                    is_active=True,
                    is_verified=True
                )
                self.db.add(user)
                self.db.flush()
                default_role = getattr(settings, "DEFAULT_OTP_USER_ROLE", "consultant")
                self.user_repo.assign_role(user, default_role)
            else:
                raise NotFoundException("User account not found.")

        user.is_verified = True
        user.last_login_at = now
        token_record.user_id = user.id
        self.db.commit()

        logger.info(f"[OTP Service] Successfully authenticated '{clean_email}' via OTP verification.")
        return self.auth_service.create_user_tokens(user)
