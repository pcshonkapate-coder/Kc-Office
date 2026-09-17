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


def test_delivery_metrics(client, admin_headers):
    res = client.get("/api/v1/delivery/metrics", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_projects" in data
    assert "active_projects" in data
    assert "open_tasks" in data
    assert data["total_projects"] >= 6


def test_list_projects(client, admin_headers):
    res = client.get("/api/v1/delivery/projects", headers=admin_headers)
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 6

    names = [p["name"] for p in projects]
    assert "Project Nexus" in names
    assert "RetailOS Cloud" in names


def test_project_detail(client, admin_headers):
    res = client.get("/api/v1/delivery/projects", headers=admin_headers)
    assert res.status_code == 200
    projects = res.json()
    proj_id = projects[0]["id"]

    res_detail = client.get(f"/api/v1/delivery/projects/{proj_id}", headers=admin_headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert "milestones" in detail
    assert "tasks" in detail
    assert "allocations" in detail


def test_task_status_progression(client, admin_headers):
    res_tasks = client.get("/api/v1/delivery/tasks", headers=admin_headers)
    assert res_tasks.status_code == 200
    tasks = res_tasks.json()
    assert len(tasks) > 0

    task = tasks[0]
    task_id = task["id"]

    res_patch = client.patch(
        f"/api/v1/delivery/tasks/{task_id}/status",
        json={"status": "done"},
        headers=admin_headers,
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "done"
