import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def admin_headers(client):
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@kapateconsultancy.com",
            "password": "KapateOS@2026!",
        },
    )
    assert res.status_code == 200
    body = res.json()
    token = body.get("access_token") or body.get("data", {}).get("access_token")
    return {"Authorization": f"Bearer {token}"}


def test_workforce_metrics(client, admin_headers):
    res = client.get("/api/v1/workforce/metrics", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_headcount" in data
    assert "full_time_count" in data
    assert "departments_count" in data
    assert data["total_headcount"] >= 8


def test_workforce_directory(client, admin_headers):
    res = client.get("/api/v1/workforce/directory", headers=admin_headers)
    assert res.status_code == 200
    members = res.json()
    assert len(members) >= 8

    names = [m["name"] for m in members]
    assert "Vikram Nair" in names
    assert "Priya Sharma" in names


def test_create_employee(client, admin_headers):
    import uuid
    email = f"arun.kumar.{uuid.uuid4().hex[:6]}@kapateconsultancy.com"
    payload = {
        "name": "Arun Kumar",
        "email": email,
        "phone": "+91 99887 11223",
        "designation": "AI Research Scientist",
        "employment_type": "full_time",
    }
    res = client.post("/api/v1/workforce/employees", json=payload, headers=admin_headers)
    assert res.status_code == 201
    created = res.json()
    assert created["name"] == "Arun Kumar"
    assert created["email"] == email
    assert created["role"] == "AI Research Scientist"


def test_attendance_flow(client, admin_headers):
    res_in = client.post("/api/v1/workforce/attendance/check-in", json={"notes": "Starting day"}, headers=admin_headers)
    assert res_in.status_code == 200
    data_in = res_in.json()
    assert data_in["check_in"] is not None
    assert data_in["status"] == "present"

    res_out = client.post("/api/v1/workforce/attendance/check-out", json={"notes": "Wrapping up"}, headers=admin_headers)
    assert res_out.status_code == 200
    data_out = res_out.json()
    assert data_out["check_out"] is not None


def test_leave_request_flow(client, admin_headers):
    payload = {
        "leave_type": "casual",
        "start_date": "2026-10-01",
        "end_date": "2026-10-02",
        "reason": "Personal errands",
    }
    res = client.post("/api/v1/workforce/leaves", json=payload, headers=admin_headers)
    assert res.status_code == 201
    leave = res.json()
    assert leave["status"] == "pending"

    leave_id = leave["id"]
    res_approve = client.patch(f"/api/v1/workforce/leaves/{leave_id}/status", json={"status": "approved"}, headers=admin_headers)
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "approved"
