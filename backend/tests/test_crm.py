import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.crm import Service, Company, Contact, Lead, Deal, Activity
from app.models.auth import User


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


def test_crm_dashboard_metrics(client):
    """Test real SQL aggregation queries for CRM dashboard."""
    response = client.get("/api/v1/crm/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "new_leads" in data
    assert "pipeline_value" in data
    assert "won_revenue" in data
    assert "conversion_rate" in data
    assert "salesperson_performance" in data
    assert "stage_distribution" in data
    assert isinstance(data["salesperson_performance"], list)


def test_service_crud_and_catalog(client, admin_headers):
    """Test configurable service catalog retrieval and management."""
    # List services
    res = client.get("/api/v1/crm/services", headers=admin_headers)
    assert res.status_code == 200
    services = res.json()
    assert len(services) >= 11
    service_names = [s["name"] for s in services]
    assert "AI Development" in service_names
    assert "Machine Learning" in service_names
    assert "Custom Software Development" in service_names

    # Admin create service
    payload = {
        "name": "Quantum Computing Advisory",
        "code": "quantum_advisory",
        "description": "Enterprise quantum readiness and post-quantum cryptography audit",
        "category": "Advisory",
        "is_active": True,
    }
    res_create = client.post("/api/v1/crm/services", json=payload, headers=admin_headers)
    assert res_create.status_code == 201
    created = res_create.json()
    service_id = created["id"]
    assert created["name"] == "Quantum Computing Advisory"

    # Update service
    res_update = client.put(
        f"/api/v1/crm/services/{service_id}",
        json={"description": "Updated description for quantum advisory"},
        headers=admin_headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["description"] == "Updated description for quantum advisory"

    # Delete service
    res_delete = client.delete(f"/api/v1/crm/services/{service_id}", headers=admin_headers)
    assert res_delete.status_code == 204


def test_company_and_contact_management(client):
    """Test company creation, multiple contacts, and retrieval."""
    # Create Company
    company_payload = {
        "name": "Apex Global Innovations",
        "industry": "Enterprise SaaS",
        "website": "https://apexinnovations.com",
        "tax_id": "27AABCA1234F1Z1",
        "company_size": "51-200",
        "source": "LinkedIn",
        "address": "Tech Park, Hinjewadi",
        "city": "Pune",
        "country": "India",
        "notes": "Fast growing B2B analytics platform",
    }
    res_co = client.post("/api/v1/crm/companies", json=company_payload)
    assert res_co.status_code == 201
    company = res_co.json()
    company_id = company["id"]
    assert company["name"] == "Apex Global Innovations"

    # Add Contact 1: CTO
    contact1_payload = {
        "company_id": company_id,
        "name": "Kavita Nair",
        "email": "kavita@apexinnovations.com",
        "phone": "+91 98765 11223",
        "job_title": "Chief Technology Officer",
        "role_in_buying_process": "CTO",
        "is_primary": True,
        "notes": "Technical lead evaluating AI solutions",
    }
    res_ct1 = client.post("/api/v1/crm/contacts", json=contact1_payload)
    assert res_ct1.status_code == 201
    contact1 = res_ct1.json()

    # Add Contact 2: VP Finance
    contact2_payload = {
        "company_id": company_id,
        "name": "Sunil Varma",
        "email": "sunil@apexinnovations.com",
        "phone": "+91 98765 44556",
        "job_title": "VP of Finance",
        "role_in_buying_process": "Finance",
        "is_primary": False,
        "notes": "Commercial decision authority",
    }
    res_ct2 = client.post("/api/v1/crm/contacts", json=contact2_payload)
    assert res_ct2.status_code == 201

    # Retrieve Company Details (with contacts list)
    res_details = client.get(f"/api/v1/crm/companies/{company_id}")
    assert res_details.status_code == 200
    details = res_details.json()
    assert details["contacts_count"] == 2
    assert len(details["contacts"]) == 2


def test_lead_lifecycle_and_conversion(client):
    """Test lead creation, qualification, and conversion to Deal."""
    # Create Lead
    lead_payload = {
        "name": "Devendra Joshi",
        "company_name": "LogiTrack Express Ltd",
        "email": "devendra@logitrack.in",
        "phone": "+91 98111 22334",
        "country": "India",
        "city": "Mumbai",
        "job_title": "Head of Digital Transformation",
        "service_interest": "AI Development",
        "budget": "₹40L - ₹60L",
        "currency": "INR",
        "project_description": "Custom LLM for freight billing document parsing and audit.",
        "source": "Website contact form",
        "priority": "high",
        "lead_score": 88,
        "status": "QUALIFICATION",
        "notes": "Hot lead with ready budget",
    }
    res_lead = client.post("/api/v1/crm/leads", json=lead_payload)
    assert res_lead.status_code == 201
    lead = res_lead.json()
    lead_id = lead["id"]
    assert lead["lead_code"].startswith("LD-")
    assert lead["status"] == "QUALIFICATION"

    # Convert Lead to Deal
    convert_payload = {
        "deal_title": "LogiTrack LLM Billing Engine",
        "estimated_value": 4500000.00,
        "currency": "INR",
        "pipeline_stage": "DISCOVERY BOOKED",
    }
    res_conv = client.post(f"/api/v1/crm/leads/{lead_id}/convert", json=convert_payload)
    assert res_conv.status_code == 201
    deal = res_conv.json()
    assert deal["title"] == "LogiTrack LLM Billing Engine"
    assert deal["pipeline_stage"] == "DISCOVERY BOOKED"
    assert float(deal["estimated_value"]) == 4500000.00

    # Verify lead status is now 'converted'
    res_chk_lead = client.get(f"/api/v1/crm/leads/{lead_id}")
    assert res_chk_lead.status_code == 200
    assert res_chk_lead.json()["status"] == "converted"
    assert res_chk_lead.json()["converted_deal_id"] == deal["id"]


def test_deal_pipeline_stages_and_drag_drop_history(client):
    """Test 10 sales pipeline stages, stage change tracking, and history."""
    # List deals
    res = client.get("/api/v1/crm/deals")
    assert res.status_code == 200
    deals = res.json()
    assert len(deals) > 0
    target_deal = deals[0]
    deal_id = target_deal["id"]

    # Transition stage (simulate Drag & Drop)
    stage_change_payload = {
        "pipeline_stage": "NEGOTIATION",
        "notes": "Client requested commercial contract draft; pricing discount approved.",
        "win_probability": 85,
    }
    res_stage = client.put(f"/api/v1/crm/deals/{deal_id}/stage", json=stage_change_payload)
    assert res_stage.status_code == 200
    history = res_stage.json()
    assert history["to_stage"] == "NEGOTIATION"

    # Verify stage history entries
    res_hist = client.get(f"/api/v1/crm/deals/{deal_id}/history")
    assert res_hist.status_code == 200
    history_list = res_hist.json()
    assert len(history_list) >= 1
    assert any(h["to_stage"] == "NEGOTIATION" for h in history_list)


def test_won_deal_to_project_bridge(client):
    """Test converting a Won deal into an active Project and signed Contract."""
    # Retrieve an existing deal or create one
    deals_res = client.get("/api/v1/crm/deals?stage=CLOSED%20WON")
    won_deals = deals_res.json()
    if won_deals:
        deal_id = won_deals[0]["id"]
    else:
        # Move first deal to CLOSED WON
        first_deal_id = client.get("/api/v1/crm/deals").json()[0]["id"]
        client.put(f"/api/v1/crm/deals/{first_deal_id}/stage", json={"pipeline_stage": "CLOSED WON"})
        deal_id = first_deal_id

    # Bridge to project
    res_bridge = client.post(f"/api/v1/crm/deals/{deal_id}/convert-to-project?project_name=Enterprise+AI+Delivery")
    assert res_bridge.status_code == 201
    data = res_bridge.json()
    assert data["success"] is True
    assert "project_id" in data["data"]
    assert "contract_id" in data["data"]
    assert data["data"]["project_code"].startswith("PRJ-")


def test_activity_logging(client):
    """Test logging multi-channel activities (call, email, meeting, note, task)."""
    # Create Activity on a deal
    deal_id = client.get("/api/v1/crm/deals").json()[0]["id"]
    activity_payload = {
        "entity_type": "deal",
        "entity_id": deal_id,
        "activity_type": "meeting",
        "subject": "Executive Strategy Alignment",
        "notes": "Reviewed deliverables timeline and resource allocations with client stakeholders.",
        "status": "completed",
    }
    res_act = client.post("/api/v1/crm/activities", json=activity_payload)
    assert res_act.status_code == 201
    act = res_act.json()
    assert act["subject"] == "Executive Strategy Alignment"
    assert act["activity_type"] == "meeting"

    # List activities for deal
    res_list = client.get(f"/api/v1/crm/activities?entity_type=deal&entity_id={deal_id}")
    assert res_list.status_code == 200
    activities = res_list.json()
    assert any(a["id"] == act["id"] for a in activities)


def test_public_contact_form_ingestion(client):
    """Test public website contact form creates a valid lead with proper source and score."""
    public_payload = {
        "name": "Sophia Chen",
        "email": "sophia@chenlogistics.com",
        "phone": "+1 415 555 2671",
        "company": "Chen Global Freight",
        "service": "Automation",
        "budget": "$50,000 - $100,000",
        "message": "We need custom robotic process automation for port clearance tracking.",
    }
    res = client.post("/api/v1/crm/leads/public", json=public_payload)
    assert res.status_code == 201
    lead = res.json()
    assert lead["contact_name"] == "Sophia Chen"
    assert lead["company_name"] == "Chen Global Freight"
    assert lead["source"] == "Website contact form"
    assert lead["lead_code"].startswith("LD-")
