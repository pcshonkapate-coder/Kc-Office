import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.db.mongodb import check_mongo_health
from app.core.config import settings


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint_includes_mongodb(client):
    """Verify that the health check endpoint returns both SQL and MongoDB telemetry."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "database" in data
    assert "mongodb" in data
    assert data["mongodb"]["database"] == settings.MONGODB_DB_NAME


def test_health_mongo_only_endpoint(client):
    """Verify detailed MongoDB telemetry endpoint."""
    response = client.get("/api/v1/health/mongo")
    assert response.status_code == 200
    data = response.json()
    assert "database" in data
    assert "latency_ms" in data


def test_mongo_health_helper_function():
    """Verify check_mongo_health returns a well-formed dictionary."""
    status = asyncio.run(check_mongo_health())
    assert "status" in status
    assert "database" in status
    assert status["database"] == settings.MONGODB_DB_NAME
