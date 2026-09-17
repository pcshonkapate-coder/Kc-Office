# Kapate OS - API Architecture Specification

## 1. Overview
The Kapate OS REST API is built with FastAPI, adhering strictly to OpenAPI 3.1 standards. All endpoints use standard HTTP status codes, Pydantic v2 schemas for bidirectional validation, and unified JSON envelope formats.

---

## 2. Global Standards

### Base URL
- Production: `https://os.kapateconsultancy.com/api/v1`
- Development: `http://localhost:8000/api/v1`

### Authentication Header
Protected endpoints require:
```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### Standard Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-15T12:00:00Z",
    "request_id": "req-9b8c2f1e"
  }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "ENTITY_NOT_FOUND",
    "message": "Project with ID 'pr-123' does not exist.",
    "details": []
  },
  "meta": {
    "timestamp": "2026-09-15T12:00:00Z",
    "request_id": "req-9b8c2f1e"
  }
}
```

---

## 3. Core API Endpoint Blueprints

### A. System & Telemetry
- `GET /api/v1/health`
  - **Auth**: None
  - **Summary**: Returns system uptime, database latency check, version, and environment.

### B. Identity & Authentication
- `POST /api/v1/auth/login`
  - **Auth**: None
  - **Body**: `{ "email": "user@kapateconsultancy.com", "password": "..." }`
  - **Returns**: JWT access token, refresh token, expiry, and user summary.
- `POST /api/v1/auth/refresh`
  - **Auth**: Refresh Token
  - **Returns**: Fresh access token.
- `GET /api/v1/auth/me`
  - **Auth**: Bearer Token
  - **Returns**: User profile, active roles, and aggregated permissions array.

### C. CRM & Sales Pipeline
- `POST /api/v1/crm/leads/public`
  - **Auth**: Public (Rate-limited, CORS restricted to company domains)
  - **Body**: Inbound consultation inquiry payload from `contact.html`.
  - **Summary**: Ingests new lead, validates budget/service, fires partner alert.
- `GET /api/v1/crm/leads`
  - **Auth**: `crm:leads:read`
- `PATCH /api/v1/crm/leads/{id}/qualify`
  - **Auth**: `crm:leads:write`
- `GET /api/v1/crm/deals`
  - **Auth**: `crm:deals:read`
- `POST /api/v1/crm/deals`
  - **Auth**: `crm:deals:write`
- `PATCH /api/v1/crm/deals/{id}/stage`
  - **Auth**: `crm:deals:write`

### D. Workforce & Resource Management
- `GET /api/v1/workforce/directory`
  - **Auth**: `workforce:directory:read`
- `POST /api/v1/workforce/timesheets`
  - **Auth**: Authenticated User
- `GET /api/v1/workforce/timesheets/approvals`
  - **Auth**: `workforce:timesheets:approve`

### E. Project Delivery (PSA)
- `GET /api/v1/delivery/projects`
  - **Auth**: `projects:read`
- `POST /api/v1/delivery/projects`
  - **Auth**: `projects:manage`
- `GET /api/v1/delivery/projects/{id}/milestones`
  - **Auth**: `projects:read`
- `PATCH /api/v1/delivery/tasks/{id}/status`
  - **Auth**: `tasks:update`

### F. Finance & GST Operations
- `GET /api/v1/finance/invoices`
  - **Auth**: `finance:invoices:read`
- `POST /api/v1/finance/invoices`
  - **Auth**: `finance:invoices:create`
- `POST /api/v1/finance/invoices/{id}/payments`
  - **Auth**: `finance:payments:record`

### G. Security Audit Logs
- `GET /api/v1/audit/logs`
  - **Auth**: `system:audit:read`
