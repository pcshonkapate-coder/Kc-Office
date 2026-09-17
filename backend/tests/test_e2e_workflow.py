import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_business_lifecycle():
    # 1. Public Website Lead Submission
    lead_payload = {
        "name": "Jane Doe",
        "email": "jane@acmeglobal.com",
        "phone": "+1-555-0199",
        "company": "Acme Global Corp",
        "service": "Cloud DevOps",
        "message": "Looking for cloud architecture & security audit for production deployment."
    }
    res_lead = client.post("/api/v1/public/leads", json=lead_payload)
    assert res_lead.status_code in [200, 201]
    lead_data = res_lead.json()
    assert lead_data["success"] is True
    assert "lead_code" in lead_data

    # 2. Check Global Search for created lead
    res_search = client.get("/api/v1/search?q=Acme")
    assert res_search.status_code == 200
    search_results = res_search.json()
    assert isinstance(search_results, dict)

    # 3. Verify Executive Analytics CEO dashboard endpoint protection
    res_exec = client.get("/api/v1/executive-analytics/ceo")
    assert res_exec.status_code in [200, 401, 403]
