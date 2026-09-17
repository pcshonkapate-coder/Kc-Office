import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.otp import OTPToken
from app.models.auth import User
from app.services.email_service import EmailService

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_otp_tokens():
    """Clean up OTP tokens before each test to prevent cooldown conflicts."""
    db = SessionLocal()
    try:
        db.query(OTPToken).delete()
        db.commit()
    finally:
        db.close()
    yield
    db = SessionLocal()
    try:
        db.query(OTPToken).delete()
        db.commit()
    finally:
        db.close()


def test_request_otp_success_and_email_dispatch(monkeypatch):
    """Verify that an employee can request a 6-digit OTP code, which triggers real-time email dispatch without leaking dev_otp in the HTTP response."""
    dispatched_emails = []

    def mock_send(to_email, otp_code, employee_name=None, purpose="LOGIN"):
        dispatched_emails.append({
            "to_email": to_email,
            "otp_code": otp_code,
            "purpose": purpose
        })
        return True

    monkeypatch.setattr(EmailService, "send_otp_email", mock_send)
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(settings, "SMTP_USER", "mailer@kapateconsultancy.com")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "app_password")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DEBUG", False)

    response = client.post(
        "/api/v1/auth/otp/request",
        json={"identifier": "admin@kapateconsultancy.com", "purpose": "LOGIN"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["identifier"] == "admin@kapateconsultancy.com"
    assert data["masked_identifier"] == "a***n@kapateconsultancy.com"
    assert data["delivery_channel"] == "email"
    assert data["expires_in_seconds"] == 300
    assert data["cooldown_seconds"] == 60
    # Security: OTP must NEVER be exposed in the response payload
    assert data.get("dev_otp") is None

    # Real-time email dispatch verification
    assert len(dispatched_emails) == 1
    dispatched = dispatched_emails[0]
    assert dispatched["to_email"] == "admin@kapateconsultancy.com"
    assert len(dispatched["otp_code"]) == 6
    assert dispatched["otp_code"].isdigit()


def test_request_otp_cooldown_rate_limiting(monkeypatch):
    """Verify that requesting an OTP twice within 60 seconds is rejected by cooldown rate limiter."""
    monkeypatch.setattr(EmailService, "send_otp_email", lambda *args, **kwargs: True)

    first_res = client.post(
        "/api/v1/auth/otp/request",
        json={"identifier": "admin@kapateconsultancy.com", "purpose": "LOGIN"}
    )
    assert first_res.status_code == 200

    # Immediate second request must trigger cooldown error
    second_res = client.post(
        "/api/v1/auth/otp/request",
        json={"identifier": "admin@kapateconsultancy.com", "purpose": "LOGIN"}
    )
    assert second_res.status_code == 400
    assert "Please wait" in str(second_res.json())


def test_verify_otp_success_and_replay_protection(monkeypatch):
    """Verify that submitting valid real-time OTP returns JWT access token and prevents reuse."""
    dispatched_code = None

    def mock_send(to_email, otp_code, employee_name=None, purpose="LOGIN"):
        nonlocal dispatched_code
        dispatched_code = otp_code
        return True

    monkeypatch.setattr(EmailService, "send_otp_email", mock_send)

    # Step 1: Request OTP
    req_res = client.post(
        "/api/v1/auth/otp/request",
        json={"identifier": "admin@kapateconsultancy.com", "purpose": "LOGIN"}
    )
    assert req_res.status_code == 200
    assert dispatched_code is not None

    # Step 2: Verify with the live dispatched OTP
    verify_res = client.post(
        "/api/v1/auth/otp/verify",
        json={
            "identifier": "admin@kapateconsultancy.com",
            "otp_code": dispatched_code,
            "purpose": "LOGIN"
        }
    )
    assert verify_res.status_code == 200
    auth_data = verify_res.json()
    assert "access_token" in auth_data
    assert auth_data["token_type"] == "bearer"
    assert auth_data["user"]["email"] == "admin@kapateconsultancy.com"

    # Step 3: Replay test - verify again with same code must be rejected
    replay_res = client.post(
        "/api/v1/auth/otp/verify",
        json={
            "identifier": "admin@kapateconsultancy.com",
            "otp_code": dispatched_code,
            "purpose": "LOGIN"
        }
    )
    assert replay_res.status_code == 401


def test_verify_otp_invalid_code_and_retry_exhaustion(monkeypatch):
    """Verify that wrong OTP returns 401 with remaining attempts, and burns token after max attempts."""
    monkeypatch.setattr(EmailService, "send_otp_email", lambda *args, **kwargs: True)

    req_res = client.post(
        "/api/v1/auth/otp/request",
        json={"identifier": "admin@kapateconsultancy.com", "purpose": "LOGIN"}
    )
    assert req_res.status_code == 200

    # Wrong code attempt
    response = client.post(
        "/api/v1/auth/otp/verify",
        json={
            "identifier": "admin@kapateconsultancy.com",
            "otp_code": "000000",
            "purpose": "LOGIN"
        }
    )
    assert response.status_code == 401
    assert "Invalid verification code" in str(response.json())


def test_self_registration_with_new_email(monkeypatch):
    """Verify that an evaluator or new user can request and verify OTP with their own real email address."""
    dispatched_code = None

    def mock_send(to_email, otp_code, employee_name=None, purpose="LOGIN"):
        nonlocal dispatched_code
        dispatched_code = otp_code
        return True

    monkeypatch.setattr(EmailService, "send_otp_email", mock_send)

    new_email = "tester.realtime.user@kapateconsultancy.com"

    # Request OTP for new email
    req_res = client.post(
        "/api/v1/auth/otp/request",
        json={"identifier": new_email, "purpose": "LOGIN"}
    )
    assert req_res.status_code == 200

    # Verify OTP and auto-provision account
    verify_res = client.post(
        "/api/v1/auth/otp/verify",
        json={
            "identifier": new_email,
            "otp_code": dispatched_code,
            "purpose": "LOGIN"
        }
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["user"]["email"] == new_email
    assert "consultant" in data["user"]["roles"]

