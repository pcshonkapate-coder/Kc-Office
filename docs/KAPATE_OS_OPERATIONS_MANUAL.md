# KAPATE OS — Operations & Deployment Manual
**Enterprise Business Operating System for Kapate Consultancy**

---

## Document Information
- **Title**: Kapate OS Operations & Production Deployment Manual
- **Document ID**: KC-OPS-MAN-2026-V1
- **Version**: 1.0 (Production Release)
- **Classification**: Internal Enterprise / Confidential
- **Target Audience**: Founder & CEO, Operations Leads, Project Managers, Engineering Staff, System Administrators
- **Author**: Kapate Consultancy Technical Architecture Team
- **Date**: September 2026

---

# 1. Executive Summary & System Architecture

## 1.1 Mission & Overview
**Kapate OS** is the unified enterprise management operating system custom-engineered for **Kapate Consultancy**. It bridges public client acquisition with end-to-end operational execution, covering customer relationship management, sales pipeline, project delivery, sprint task tracking, workforce management, intern training mentorship, financial invoicing, and isolated client workspaces.

## 1.2 Multi-Tier Architecture
Kapate OS is built on a modern, modular, scalable 3-tier architecture:

```
+-------------------------------------------------------------------------+
|                           CLIENT INTERFACES                             |
|  +-----------------------------+     +-------------------------------+  |
|  |  Public Marketing Website   |     |     Kapate OS Enterprise App  |  |
|  |  (HTML5 / CSS3 / Vanilla JS)|     |     (Next.js / React 19 / TS) |  |
|  |  Port: 3000                 |     |     Port: 3001                |  |
|  +-----------------------------+     +-------------------------------+  |
+------------------------------------+------------------------------------+
                                     | (REST API / HTTPS / JWT)
                                     v
+-------------------------------------------------------------------------+
|                      APPLICATION & BUSINESS LAYER                       |
|  +-------------------------------------------------------------------+  |
|  |  FastAPI Enterprise REST Engine (Python 3.11+)                    |  |
|  |  - JWT Authentication & RBAC Authorization Middleware             |  |
|  |  - CRM, Projects, Workforce, Finance & Audit Subsystems           |  |
|  |  - Port: 8000 (Uvicorn / Gunicorn Asynchronous Workers)           |  |
|  +-------------------------------------------------------------------+  |
+------------------------------------+------------------------------------+
                                     | (SQLAlchemy 2.0 ORM / WAL Mode)
                                     v
+-------------------------------------------------------------------------+
|                           DATA STORAGE LAYER                            |
|  +-------------------------------------------------------------------+  |
|  |  Relational Database (SQLite in WAL mode / PostgreSQL 15+)        |  |
|  |  - Foreign Key Enforcements & Cascade Constraints                 |  |
|  |  - Encrypted Password Hashes (Bcrypt) & Immutable Audit Logging   |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

# 2. Role-Based Access Control (RBAC) & Security Policy

Kapate OS enforces granular, zero-trust role-based authorization across all endpoints and UI views:

| Role | CRM & Sales | Projects & Tasks | Workforce / HR | Finance & Invoices | Client Workspace | Audit Logs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **SUPER ADMIN / CEO** | Full Access | Full Access | Full Access | Full Access | Full Access | Full Access |
| **PROJECT MANAGER** | View / Edit Deals | Full Delivery Control | View Team / Assign Tasks | View Project Budgets | View Client Sprints | View Actions |
| **EMPLOYEE** | View Assigned Leads | Task Execution & Sprints | Personal Profile & Clock-in | Submit Expenses / View Pay | Restricted | Self Actions |
| **INTERN** | No Access | Assigned Tasks Only | View Mentor / Training Hub | No Access | No Access | Self Actions |
| **FINANCE CONTROLLER** | View Won Deals | View Budgets | View Payroll & Contracts | Full Invoicing & Tax Control | No Access | Financial Logs |
| **CLIENT** | No Access | No Access | No Access | View Own Invoices Only | Dedicated Isolated Portal | No Access |

### Critical Security Boundaries
1. **Client Isolation**: Clients can ONLY access their specific project milestones, deliverable progress, and authorized invoices. Employee salaries, internal hourly cost rates, profit margins, and internal HR notes are strictly excluded from API responses and client view.
2. **Intern Data Containment**: Interns have zero access to client commercial rates, company finances, or other employees' confidential compensation details.

---

# 3. Step-by-Step Module Operations Guide

## 3.1 CRM & Sales Pipeline Management
- **Adding a Lead**: Navigate to **CRM** -> Click **Add Lead**. Input lead name, company, email, phone, service interest (AI Solutions, ML & Data Analytics, Custom Software, IT Solutions), and estimated budget.
- **Stage Progression**: Track deals across the pipeline stages: *New Lead -> Discovery Call -> Proposal Sent -> Negotiation -> Won / Contract Signed*.
- **Quick Search & Filters**: Filter leads by service line, deal owner, or qualification score.

## 3.2 Proposals, Contracts & E-Signatures
- **Drafting Proposals**: Select an active deal -> Click **Generate Proposal**. Specify deliverable milestones, payment terms, and timeline.
- **Contract Execution**: Once accepted, convert proposal to a formal contract with digital signature tracking.

## 3.3 Project Delivery, Sprints & Kanban
- **Project Initiation**: Create new delivery workspaces with total budget, assigned Project Manager, client contact, and deadline.
- **Task Management**: Use the interactive Kanban board (*TODO -> IN PROGRESS -> IN REVIEW -> COMPLETED*) to assign tasks with priority and story points.
- **Milestone Tracking**: Log milestone progress to trigger client invoice release and milestone verification.

## 3.4 Workforce, Mentorship & Intern Hub
- **Employee Profiles**: Manage skills inventory, project allocations, and capacity utilization.
- **Intern Mentorship**: Dedicated Intern Hub allows mentors to track training module completion, log weekly evaluations across 4 competencies (Technical, Problem Solving, Communication, Delivery), and generate verified **Certificates of Completion**.

## 3.5 Time Tracking & Attendance
- **Daily Clock-In**: Team members log start times and daily attendance.
- **Timesheet Submission**: Engineers log hours against specific projects and tasks for manager approval before billing.

## 3.6 Finance, Invoicing & Profitability
- **Invoice Generation**: Create GST-compliant invoices linked directly to verified project milestones.
- **Profitability Audit**: Real-time margin calculations analyzing billed revenue vs. developer labor costs and operational expenses.

## 3.7 Isolated Client Portal
- Stakeholder transparency portal displaying real-time project progress, milestone timelines, downloadable contracts, and approved invoices.

---

# 4. Production Deployment & Server Setup Guide

## 4.1 Prerequisites
- **Operating System**: Ubuntu 22.04 LTS (Recommended) or Debian 12 / Windows Server 2022
- **Runtimes**: Node.js 20+ LTS, Python 3.11+, Git
- **Web Server / Reverse Proxy**: Nginx with SSL (Let's Encrypt / Certbot)
- **Process Manager**: PM2 (for Node.js frontend) and Systemd (for FastAPI backend)

## 4.2 Backend Deployment (FastAPI)

```bash
# 1. Clone repository and navigate to backend directory
cd /var/www/kapate-consultancy/backend

# 2. Initialize Python virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install production dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Configure Production Environment (.env)
cat <<EOF > .env
PROJECT_NAME="Kapate OS API"
API_V1_STR="/api/v1"
SECRET_KEY="YOUR_STRONG_RANDOMLY_GENERATED_JWT_SECRET_KEY"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="sqlite:////var/www/kapate-consultancy/kapate_os.db"
CORS_ORIGINS=["https://kapateconsultancy.com","https://os.kapateconsultancy.com"]
ENVIRONMENT="production"
EOF

# 5. Create Systemd Service File (/etc/systemd/system/kapate-backend.service)
sudo cat <<EOF > /etc/systemd/system/kapate-backend.service
[Unit]
Description=Kapate OS FastAPI Enterprise Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/kapate-consultancy/backend
ExecStart=/var/www/kapate-consultancy/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 6. Enable and Start Backend Service
sudo systemctl daemon-reload
sudo systemctl enable kapate-backend
sudo systemctl start kapate-backend
```

## 4.3 Frontend Deployment (Next.js)

```bash
# 1. Navigate to frontend directory
cd /var/www/kapate-consultancy/kapate-os-frontend

# 2. Install dependencies & build standalone bundle
pnpm install --frozen-lockfile
pnpm build

# 3. Start with PM2
pm2 start npm --name "kapate-os-frontend" -- start -- -p 3001
pm2 save
pm2 startup
```

## 4.4 Nginx Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name os.kapateconsultancy.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name os.kapateconsultancy.com;

    ssl_certificate /etc/letsencrypt/live/os.kapateconsultancy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/os.kapateconsultancy.com/privkey.pem;

    # Kapate OS Next.js Frontend
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # FastAPI Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

# 5. Database Maintenance & Automated Backups

## 5.1 Automated Daily Backups
Add the following cron entry to back up the database daily at 02:00 AM:

```bash
# Open crontab
crontab -e

# Daily Backup at 2 AM
0 2 * * * cp /var/www/kapate-consultancy/kapate_os.db /var/backups/kapate-os/kapate_os_$(date +\%Y\%m\%d_\%H\%M\%S).db
# Retain only last 30 days
0 3 * * * find /var/backups/kapate-os/ -type f -name "*.db" -mtime +30 -delete
```

---

# 6. Operational Health Checks & Troubleshooting

| Symptom | Diagnostic Step | Resolution |
| :--- | :--- | :--- |
| **Backend API Unreachable** | `curl -I http://127.0.0.1:8000/api/v1/health` | Restart systemd service: `sudo systemctl restart kapate-backend` |
| **JWT Token Expired** | Inspect browser local storage / Auth header | User signs in again or refresh token is called |
| **Port Conflict on 3001** | `lsof -i :3001` or `netstat -ano` | Terminate dangling process and restart PM2 |
| **Database Locked** | Check SQLite WAL mode journal | Enable WAL mode: `PRAGMA journal_mode=WAL;` |

---

*Kapate OS © 2026 Kapate Consultancy. All rights reserved.*
