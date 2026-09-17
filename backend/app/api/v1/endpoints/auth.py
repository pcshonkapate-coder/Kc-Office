from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.services.auth_service import AuthService
from app.services.otp_service import OTPService
from app.schemas.auth import LoginRequest, TokenResponse, UserSummary
from app.schemas.otp import OTPRequestPayload, OTPRequestResponse, OTPVerifyPayload, OTPResendPayload
from app.repositories.user_repository import UserRepository
from app.models.auth import User

router = APIRouter()


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK, tags=["Authentication"])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with email and password, returning JWT access token and user claims.
    """
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(request.email, request.password)
    return auth_service.create_user_tokens(user)


@router.post("/otp/request", response_model=OTPRequestResponse, status_code=status.HTTP_200_OK, tags=["Authentication"])
def request_otp(payload: OTPRequestPayload, db: Session = Depends(get_db)):
    """
    Generate and dispatch a secure 6-digit OTP code to an employee's work email.
    """
    otp_service = OTPService(db)
    return otp_service.request_otp(payload.identifier, payload.purpose)


@router.post("/otp/verify", response_model=TokenResponse, status_code=status.HTTP_200_OK, tags=["Authentication"])
def verify_otp(payload: OTPVerifyPayload, db: Session = Depends(get_db)):
    """
    Verify the 6-digit OTP code and issue authenticated JWT tokens for the employee.
    """
    otp_service = OTPService(db)
    return otp_service.verify_otp(payload)


@router.post("/otp/resend", response_model=OTPRequestResponse, status_code=status.HTTP_200_OK, tags=["Authentication"])
def resend_otp(payload: OTPResendPayload, db: Session = Depends(get_db)):
    """
    Resend a fresh OTP code enforcing cooldown constraints.
    """
    otp_service = OTPService(db)
    return otp_service.request_otp(payload.identifier, payload.purpose)


@router.get("/me", response_model=UserSummary, status_code=status.HTTP_200_OK, tags=["Authentication"])
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve authenticated user profile, assigned roles, and aggregated permissions.
    """
    user_repo = UserRepository(db)
    roles = user_repo.get_roles(current_user)
    permissions = user_repo.get_permissions(current_user)

    if "superadmin" in roles and "*" not in permissions:
        permissions.append("*")

    return UserSummary(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        roles=roles,
        permissions=permissions
    )
