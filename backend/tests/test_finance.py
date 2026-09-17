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


def test_finance_metrics(client, admin_headers):
    res = client.get("/api/v1/finance/metrics", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_revenue_paid" in data
    assert "total_receivable_sent" in data
    assert "total_overdue" in data
    assert "total_expenses_approved" in data


def test_list_invoices(client, admin_headers):
    res = client.get("/api/v1/finance/invoices", headers=admin_headers)
    assert res.status_code == 200
    invoices = res.json()
    assert len(invoices) >= 6

    inv_numbers = [i["invoice_number"] for i in invoices]
    assert "INV-0042" in inv_numbers
    assert "INV-0040" in inv_numbers


def test_list_and_create_expenses(client, admin_headers):
    res = client.get("/api/v1/finance/expenses", headers=admin_headers)
    assert res.status_code == 200
    expenses = res.json()
    assert len(expenses) >= 4

    payload = {
        "expense_category": "cloud_compute",
        "amount": "15000.00",
        "currency": "INR",
        "description": "Monthly GCP cloud compute charges",
    }
    res_create = client.post("/api/v1/finance/expenses", json=payload, headers=admin_headers)
    assert res_create.status_code == 201
    created = res_create.json()
    assert created["status"] == "submitted"
    assert created["expense_category"] == "cloud_compute"
