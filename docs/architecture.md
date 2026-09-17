# Kapate OS - System Architecture Specification

## 1. Executive Summary
**Kapate OS** is the internal business operating system for **Kapate Consultancy**, designed to unify CRM, Workforce Management (Employees, Interns, Freelancers), Project Delivery (PSA), Financial Operations, and AI Automation into a cohesive, secure, and scalable platform.

---

## 2. Architecture Principles
1. **Clean Architecture & Domain Separation**: Clear boundaries between Presentation (Next.js), Application/API (FastAPI), Domain/Services, and Persistence (SQLAlchemy/PostgreSQL).
2. **Security-First Design**: Role-Based Access Control (RBAC), granular permissions, bcrypt password hashing, short-lived JWT access tokens with refresh tokens, and immutable audit logs.
3. **Normalized Relational Data Model**: 37 normalized relational entities ensuring strict data integrity, foreign key constraints, and transactional consistency.
4. **API-First & Strongly Typed**: Strict Pydantic v2 request/response contracts and OpenAPI 3.1 specifications auto-generated for every endpoint.
5. **Multi-Environment Adaptability**: Runs seamlessly in containerized Docker environments with PostgreSQL, and provides automatic local SQLite fallback for rapid local test execution without infrastructure friction.

---

## 3. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                       Presentation Layer (Frontend)                     |
|                                                                         |
|  +-----------------------------+       +-----------------------------+  |
|  |       Public Website        |       |      Kapate OS Shell        |  |
|  | (Static HTML/JS at Root)    |       | (Next.js 14, React, TS,     |  |
|  | - Lead capture forms        |       |  Tailwind, Executive Theme) |  |
|  +--------------+--------------+       +--------------+--------------+  |
+-----------------|-------------------------------------|-----------------+
                  | Public Lead Ingestion               | Authenticated Requests
                  | POST /api/v1/crm/leads/public       | (JWT Bearer Token)
                  v                                     v
+-------------------------------------------------------------------------+
|                    Application & API Layer (Backend)                    |
|                                                                         |
|  FastAPI 0.115+ | Python 3.11/3.13 | Pydantic v2 | Uvicorn               |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Middleware: CORS, Request-ID, Error Handling, Audit Logger        |  |
|  +-------------------------------------------------------------------+  |
|  | API Routers (/api/v1):                                            |  |
|  |  - /health (System telemetry & DB latency check)                  |  |
|  |  - /auth (Login, Token Refresh, Current User Me)                  |  |
|  |  - /crm (Leads, Companies, Contacts, Deals, Contracts)            |  |
|  |  - /delivery (Projects, Milestones, Tasks, Resources)             |  |
|  |  - /workforce (Employees, Interns, Freelancers, Timesheets)       |  |
|  |  - /finance (Invoices, Items, Payments, GST Compliance)           |  |
|  |  - /audit (Security & State-Change Event Log)                     |  |
|  +-------------------------------------------------------------------+  |
|  | Service Layer: Pure business logic & validation                   |  |
|  +-------------------------------------------------------------------+  |
|  | Repository Layer: Abstracted data access via SQLAlchemy 2.0       |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                       Persistence Layer (Database)                      |
|                                                                         |
|  Production: PostgreSQL 16 (Relational tables, Foreign Keys, Indexes)   |
|  Development / Testing: SQLite 3 / PostgreSQL                           |
|  Migrations: Alembic Version Control                                    |
|  Object Storage: Local disk / S3-compatible for documents               |
+-------------------------------------------------------------------------+
```

---

## 4. Module Decomposition

### A. Core Identity & RBAC
- Manages authentication, user accounts, system roles, granular permissions, and authorization guards.
- Provides token issuance, verification, and password reset workflows.

### B. CRM & Business Development
- Ingestion of client inquiries from `contact.html`.
- Pipeline tracking: Lead Qualification -> Discovery -> NDA -> Proposal -> SOW Negotiation -> Closed Won.
- Accounts (Companies) and Contact Stakeholder management.

### C. Workforce & Resource Management
- Differentiated workforce models:
  - **Employees**: Full-time / part-time staff, designations, compensation bands.
  - **Interns**: Structured mentorship, stipend, program duration.
  - **Freelancers**: Contract hourly/daily rates, master agreements, specialized domains.
- Attendance, Leave Requests, and Weekly Timesheets tied directly to project delivery.

### D. Project Delivery & PSA (Professional Services Automation)
- Projects, Milestones, Tasks, Subtasks, and internal Task Comments.
- Resource allocation tracking to compute consultant utilization and project burn rates.

### E. Financial Operations & GST
- Project expense tracking with categorization (Cloud compute, travel, tooling).
- Milestone-triggered invoicing with Indian GST compliance (CGST/SGST/IGST breakdown) and multi-currency support (INR/USD/EUR).
- Payment reconciliation and project gross margin calculations.

### F. Shared Systems & Infrastructure
- Document registry with MIME-type verification and storage keys.
- Real-time and email notification queue.
- Immutable security audit logs recording user ID, IP address, action, and JSON diffs.
