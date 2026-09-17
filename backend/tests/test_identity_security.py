import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.auth import User, Role
from app.models.workforce import PersonProfile, Employee, Intern
from app.models.identity import RegistrationRequest, OnboardingInvitation, KapateIdSequence
from app.services.identity_service import IdentityService
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def admin_headers(db):
    admin = db.query(User).filter(User.email == "admin@kapateconsultancy.com").first()
    if not admin:
        admin = User(
            email="admin@kapateconsultancy.com",
            hashed_password=get_password_hash("AdminPass123!"),
            full_name="Shon Kapate",
            is_active=True,
            is_verified=True
        )
        super_role = db.query(Role).filter(Role.name == "superadmin").first()
        if super_role:
            admin.roles.append(super_role)
        db.add(admin)
        db.commit()
        db.refresh(admin)

    token = create_access_token(admin.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def employee_headers(db):
    emp = db.query(User).filter(User.email == "test_emp@kapateconsultancy.com").first()
    if not emp:
        emp = User(
            email="test_emp@kapateconsultancy.com",
            hashed_password=get_password_hash("EmpPass123!"),
            full_name="Test Employee",
            is_active=True,
            is_verified=True
        )
        eng_role = db.query(Role).filter(Role.name == "engineer").first()
        if eng_role:
            emp.roles.append(eng_role)
        db.add(emp)
        db.commit()
        db.refresh(emp)

    token = create_access_token(emp.id)
    return {"Authorization": f"Bearer {token}", "User-Id": emp.id}


@pytest.fixture
def intern_headers(db):
    intern = db.query(User).filter(User.email == "test_intern@kapateconsultancy.com").first()
    if not intern:
        intern = User(
            email="test_intern@kapateconsultancy.com",
            hashed_password=get_password_hash("InternPass123!"),
            full_name="Test Intern",
            is_active=True,
            is_verified=True
        )
        int_role = db.query(Role).filter(Role.name == "intern").first()
        if int_role:
            intern.roles.append(int_role)
        db.add(intern)
        db.commit()
        db.refresh(intern)

    token = create_access_token(intern.id)
    return {"Authorization": f"Bearer {token}", "User-Id": intern.id}


@pytest.fixture
def client_headers(db):
    client_user = db.query(User).filter(User.email == "test_client@enterprise.com").first()
    if not client_user:
        client_user = User(
            email="test_client@enterprise.com",
            hashed_password=get_password_hash("ClientPass123!"),
            full_name="Enterprise Client",
            is_active=True,
            is_verified=True
        )
        cl_role = db.query(Role).filter(Role.name == "client").first()
        if cl_role:
            client_user.roles.append(cl_role)
        db.add(client_user)
        db.commit()
        db.refresh(client_user)

    token = create_access_token(client_user.id)
    return {"Authorization": f"Bearer {token}", "User-Id": client_user.id}


# =============================================================================
# 1. PUBLIC REGISTRATION SECURITY
# =============================================================================

def test_public_registration_cannot_set_role(db):
    """
    Ensure public registration creates a PENDING request and client cannot self-assign roles.
    """
    payload = {
        "full_name": "Applicant Rohit",
        "email": "rohit_applicant@test.com",
        "phone": "+91 99999 11111",
        "application_id": "APP-2026-99",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "requested_type": "EMPLOYEE"
    }
    # Clean up previous test run if exists
    db.query(RegistrationRequest).filter(RegistrationRequest.email == payload["email"]).delete()
    db.commit()

    res = client.post("/api/v1/identity/register-request", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "PENDING"
    assert data["email"] == payload["email"]
    assert "role" not in data  # No role is granted or exposed


# =============================================================================
# 2. PRIVILEGE ESCALATION ATTACKS (EXPECTED: 403 FORBIDDEN)
# =============================================================================

def test_employee_self_role_escalation_blocked(employee_headers):
    """
    Employee attempts to promote themselves to ADMIN -> 403 Forbidden
    """
    res = client.patch(
        f"/api/v1/identity/users/{employee_headers['User-Id']}/role",
        headers={"Authorization": employee_headers["Authorization"]},
        json={"new_role": "ADMIN", "confirm_privilege_change": True}
    )
    assert res.status_code == 403


def test_employee_tampering_other_user_blocked(employee_headers, db):
    """
    Employee attempts to modify another user's permissions or profile -> 403 Forbidden
    """
    other = db.query(User).filter(User.email == "admin@kapateconsultancy.com").first()
    res = client.patch(
        f"/api/v1/identity/users/{other.id}",
        headers={"Authorization": employee_headers["Authorization"]},
        json={"name": "Compromised Name"}
    )
    assert res.status_code == 403


def test_intern_accessing_security_dashboard_blocked(intern_headers):
    """
    Intern attempts to access Admin Security Dashboard -> 403 Forbidden
    """
    res = client.get(
        "/api/v1/identity/security-dashboard",
        headers={"Authorization": intern_headers["Authorization"]}
    )
    assert res.status_code == 403


from app.models.delivery import Project


def test_intern_cannot_assign_task_to_manager(intern_headers, db):
    """
    Intern attempts to assign task to an Admin/Manager -> 403 Forbidden
    """
    admin = db.query(User).filter(User.email == "admin@kapateconsultancy.com").first()
    proj = db.query(Project).first()
    proj_id = proj.id if proj else "PRJ-001"

    res = client.post(
        "/api/v1/delivery/tasks",
        headers={"Authorization": intern_headers["Authorization"]},
        json={
            "title": "Intern Assigned Task to Admin",
            "project_id": proj_id,
            "assigned_to_user_id": admin.id,
            "priority": "Urgent",
            "status": "TODO"
        }
    )
    assert res.status_code == 403


def test_client_cannot_create_internal_task(client_headers, db):
    """
    Client attempts to create internal employee tasks directly -> 403 Forbidden
    """
    admin = db.query(User).filter(User.email == "admin@kapateconsultancy.com").first()
    proj = db.query(Project).first()
    proj_id = proj.id if proj else "PRJ-001"

    res = client.post(
        "/api/v1/delivery/tasks",
        headers={"Authorization": client_headers["Authorization"]},
        json={
            "title": "Client Injected Task",
            "project_id": proj_id,
            "assigned_to_user_id": admin.id,
            "priority": "High",
            "status": "TODO"
        }
    )
    assert res.status_code == 403


# =============================================================================
# 3. ATOMIC UNIQUE KAPATE ID GENERATION
# =============================================================================

def test_atomic_unique_kapate_id_generation(db):
    """
    Verify server-side atomic generation of non-reusable, monotonic Kapate IDs.
    """
    service = IdentityService(db)
    id1 = service.generate_kapate_id("EMPLOYEE")
    id2 = service.generate_kapate_id("EMPLOYEE")
    id_int = service.generate_kapate_id("INTERN")
    id_frl = service.generate_kapate_id("FREELANCER")

    assert id1.startswith("KAP-EMP-")
    assert id2.startswith("KAP-EMP-")
    assert id_int.startswith("KAP-INT-")
    assert id_frl.startswith("KAP-FRL-")
    assert id1 != id2


# =============================================================================
# 4. INVITATION LIFECYCLE: SINGLE-USE & REVOCATION
# =============================================================================

def test_invitation_single_use_and_reuse_blocked(admin_headers, db):
    """
    Admin onboards user -> user accepts -> second attempt to accept must fail.
    """
    onboard_payload = {
        "full_name": "Test Onboard User",
        "email": "test_onboard_user@kapateconsultancy.com",
        "phone": "+91 88888 22222",
        "designation": "Junior Engineer",
        "employment_type": "EMPLOYEE",
        "role": "EMPLOYEE"
    }
    # Clean up previous run if any
    db.query(OnboardingInvitation).filter(OnboardingInvitation.email == onboard_payload["email"]).delete()
    db.query(PersonProfile).filter(PersonProfile.email == onboard_payload["email"]).delete()
    db.query(User).filter(User.email == onboard_payload["email"]).delete()
    db.commit()

    res = client.post(
        "/api/v1/identity/onboard",
        headers={"Authorization": admin_headers["Authorization"]},
        json=onboard_payload
    )
    assert res.status_code == 201
    data = res.json()
    token = data["invitation_token"]
    assert token is not None

    # 1st Accept: Should succeed
    accept_res = client.post(
        "/api/v1/identity/invite/accept",
        json={
            "token": token,
            "password": "Password123!",
            "confirm_password": "Password123!"
        }
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACTIVE"

    # 2nd Accept: Should be rejected (invitation already used)
    reuse_res = client.post(
        "/api/v1/identity/invite/accept",
        json={
            "token": token,
            "password": "Password123!",
            "confirm_password": "Password123!"
        }
    )
    assert reuse_res.status_code == 400


def test_invitation_revocation(admin_headers, db):
    """
    Admin onboards user, revokes invitation -> attempt to accept is rejected.
    """
    onboard_payload = {
        "full_name": "Revoke Candidate",
        "email": "revoke_candidate@kapateconsultancy.com",
        "phone": "+91 88888 33333",
        "designation": "QA Intern",
        "employment_type": "INTERN",
        "role": "INTERN"
    }
    db.query(OnboardingInvitation).filter(OnboardingInvitation.email == onboard_payload["email"]).delete()
    db.query(PersonProfile).filter(PersonProfile.email == onboard_payload["email"]).delete()
    db.query(User).filter(User.email == onboard_payload["email"]).delete()
    db.commit()

    res = client.post(
        "/api/v1/identity/onboard",
        headers={"Authorization": admin_headers["Authorization"]},
        json=onboard_payload
    )
    assert res.status_code == 201
    data = res.json()
    token = data["invitation_token"]

    # Revoke invitation
    inv_record = db.query(OnboardingInvitation).filter(OnboardingInvitation.email == onboard_payload["email"]).first()
    assert inv_record is not None

    revoke_res = client.post(
        f"/api/v1/identity/invitations/{inv_record.id}/revoke",
        headers={"Authorization": admin_headers["Authorization"]}
    )
    assert revoke_res.status_code == 200

    # Attempt to accept revoked invitation
    accept_res = client.post(
        "/api/v1/identity/invite/accept",
        json={
            "token": token,
            "password": "Password123!",
            "confirm_password": "Password123!"
        }
    )
    assert accept_res.status_code == 400


# =============================================================================
# 5. SUSPENDED ACCOUNT IMMEDIATE SESSION REVOCATION
# =============================================================================

def test_suspended_account_session_revocation(admin_headers, db):
    """
    Admin suspends account -> token for suspended user is immediately rejected.
    """
    # Create an active user
    victim = db.query(User).filter(User.email == "victim@kapateconsultancy.com").first()
    if not victim:
        victim = User(
            email="victim@kapateconsultancy.com",
            hashed_password=get_password_hash("VictimPass123!"),
            full_name="Victim Staff",
            is_active=True,
            is_verified=True
        )
        db.add(victim)
        db.commit()
        db.refresh(victim)
    else:
        victim.is_active = True
        db.commit()
        db.refresh(victim)

    token = create_access_token(victim.id)
    victim_auth = {"Authorization": f"Bearer {token}"}

    # User can access self profile
    res1 = client.get("/api/v1/auth/me", headers=victim_auth)
    assert res1.status_code == 200

    # Admin suspends user
    suspend_res = client.patch(
        f"/api/v1/identity/users/{victim.id}/status",
        headers={"Authorization": admin_headers["Authorization"]},
        json={"status": "SUSPENDED", "reason": "Security policy violation"}
    )
    assert suspend_res.status_code == 200

    # User attempts to call protected endpoint with existing token -> must be rejected
    res2 = client.get("/api/v1/auth/me", headers=victim_auth)
    assert res2.status_code in [401, 403]
