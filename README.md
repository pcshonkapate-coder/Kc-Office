# Kapate Consultancy & Kapate OS

A high-performance enterprise operations system and corporate platform engineered for **Kapate Consultancy**.

---

## 📁 Repository Structure

```tree
Kapate_Consultancy/
├── src/                      # Next.js 16 Frontend Application (Kapate OS UI)
│   ├── app/                  # App Router pages, layouts, and API routes
│   │   ├── dashboard/        # Operations modules (CRM, Workforce, Finance, Projects, etc.)
│   │   ├── favicon.ico       # Favicon
│   │   ├── globals.css       # Tailwind & global theme styling
│   │   ├── layout.tsx        # Root layout wrapper
│   │   └── page.tsx          # Login & landing portal
│   ├── components/           # Reusable UI widgets, layout shells, modules & modals
│   │   ├── auth/             # Authentication & demo role switcher
│   │   ├── layout/           # AppShell, TopBar, Sidebar navigation
│   │   ├── modals/           # Global search, quick create, journey modals
│   │   ├── modules/          # Dedicated domain views (CRM, Finance, Projects, Team, etc.)
│   │   └── ui/               # Toast notifications and primitive components
│   ├── data/                 # Frontend mock datasets & seeds
│   ├── lib/                  # CRM & Backend API client connectors
│   ├── services/             # Business logic layer & data services
│   ├── store/                # Zustand client state management
│   └── types/                # TypeScript interface and model definitions
│
├── backend/                  # FastAPI Enterprise Backend Engine
│   ├── app/                  # Application core, API v1 routes, models, schemas, repositories
│   │   ├── api/v1/           # Versioned REST API endpoints (Workforce, CRM, Finance, etc.)
│   │   ├── core/             # Configuration, security (JWT/RBAC), logging
│   │   ├── db/               # SQLAlchemy session & base models
│   │   ├── models/           # ORM entities (User, Role, Lead, Deal, Project, Invoice, etc.)
│   │   ├── repositories/     # Data access patterns
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Domain workflow & business logic services
│   ├── tests/                # Pytest automated test suites
│   ├── requirements.txt      # Python backend dependencies
│   └── .env.example          # Backend environment template
│
├── website/                  # Public Corporate Marketing Website
│   ├── assets/               # Brand assets & high-resolution imagery
│   ├── css/                  # Styling & layout sheets
│   ├── js/                   # Interactive scripts & navigation logic
│   └── *.html                # Public service pages (AI, Software, ML & Data, Industries, etc.)
│
├── docs/                     # Technical & Operational Documentation
│   ├── KAPATE_OS_OPERATIONS_MANUAL.md  # Standard Operating Procedures (SOP)
│   ├── Kapate_OS_Operations_Manual.pdf # Operations Manual PDF
│   ├── architecture.md                 # System architecture overview
│   ├── api_spec.md                     # Backend API specifications
│   ├── database_schema_erd.md          # Entity-Relationship Diagrams & schema design
│   ├── rbac_matrix.md                  # Role-Based Access Control matrix
│   ├── production_deployment.md        # Nginx + Gunicorn + Systemd production guide
│   ├── backup_strategy.md              # Disaster recovery & automated backup strategy
│   └── dev_guide.md                    # Developer onboarding & workflow guide
│
├── scripts/                  # Operations & Database Automation Scripts
│   ├── init_db.py            # SQLite / PostgreSQL reflection & full RBAC seeder
│   ├── init_production_db.py # Production database seeder
│   ├── clean_database.py     # Database cleanup utility
│   └── generate_operations_manual_pdf.py # PDF manual generator
│
├── public/                   # Static public assets for Next.js app
├── package.json              # Frontend Node dependencies & scripts
├── tsconfig.json             # TypeScript compiler configuration
└── .env.example              # Frontend environment configuration template
```

---

## 🚀 Quick Start

### 1. Frontend (Kapate OS Web App)

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm dev

# Build for production
pnpm build
```

The web application will be accessible at `http://localhost:3000`.

### 2. Backend (FastAPI Core)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations & seed standard RBAC roles
python ../scripts/init_db.py

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Interactive API documentation will be available at `http://127.0.0.1:8000/docs`.

### 3. Public Marketing Website

The static corporate website is located in `/website`. You can host it using Nginx, Caddy, or serve locally:

```bash
cd website
node server.js
```

---

## 🛡️ Role-Based Access Control (RBAC)

Kapate OS includes granular permission enforcement across 7 standard enterprise roles:
- **Superadmin**: Full unrestricted system governance.
- **Partner**: Executive leadership, deal pipeline, contracts, and financial summaries.
- **Consultant**: Client advisory, proposal workflows, assigned projects, timesheet logging.
- **Engineer**: Technical delivery, task lifecycle, and workload management.
- **Intern**: Training workflows, assigned tasks, and attendance tracking.
- **Freelancer**: External contractor tasks and vendor invoice submissions.
- **Client**: Dedicated portal for project progress, milestones, and invoice visibility.

---

## 📖 Documentation Reference

Detailed operational and technical specifications are available in the [`docs/`](file:///docs/) directory:
- [Operations Manual](file:///docs/KAPATE_OS_OPERATIONS_MANUAL.md)
- [System Architecture](file:///docs/architecture.md)
- [Database ERD & Schemas](file:///docs/database_schema_erd.md)
- [RBAC Matrix](file:///docs/rbac_matrix.md)
- [Production Deployment Guide](file:///docs/production_deployment.md)
