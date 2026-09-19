# Kapate OS - Local Development & Operations Guide

## 1. Prerequisites
- **Python**: 3.11 or 3.13
- **Node.js**: v20+ with npm / npx
- **Docker & Docker Compose**: (Optional for local SQLite mode, required for full production PostgreSQL containerization)

---

## 2. Directory Layout
```
Kapate_Consultancy/
├── backend/            # FastAPI Python backend application
├── frontend/           # Next.js 14 TypeScript web frontend
├── docs/               # Architecture, ERD, API, and RBAC specifications
├── infra/              # Docker Compose and Nginx configs
├── scripts/            # Database initialization and utility runners
└── (Marketing Site)    # Preserved public website files (index.html, etc.)
```

---

## 3. Quick Start (Local Development)

### A. Backend Setup
1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
5. Initialize the database and default admin seed:
   ```bash
   python ../scripts/init_db.py
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - Interactive Swagger API Documentation: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/api/v1/health`

### B. Frontend Setup
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) (or the port indicated if the marketing server is running) to access Kapate OS.

---

## 4. Default Credentials (Development Seed)
- **Superadmin Email**: `admin@kapateconsultancy.in`
- **Initial Password**: `Admin@KC8421174957`
*(Must be rotated upon initial production deployment)*

---

## 5. Running Automated Tests
From the project root:
```bash
python -m pytest backend/tests/ -v
```
