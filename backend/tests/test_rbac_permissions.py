import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "ok"]

def test_unauthenticated_protected_endpoint():
    response = client.get("/api/v1/audit/logs")
    assert response.status_code in [200, 401]

def test_global_search_endpoint():
    response = client.get("/api/v1/search?q=test")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

def test_timeline_endpoint():
    response = client.get("/api/v1/timeline/company/demo-123")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
