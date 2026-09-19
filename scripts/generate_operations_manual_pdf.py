import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Skip header & footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running Header
        self.drawString(54, 11 * 72 - 36, "KAPATE OS — Enterprise Operations & Deployment Manual")
        self.drawRightString(8.5 * 72 - 54, 11 * 72 - 36, "Kapate Consultancy • Confidential")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)

        # Running Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawString(54, 36, "Kapate OS v1.0 Production Architecture")
        self.drawRightString(8.5 * 72 - 54, 36, page_str)
        self.line(54, 46, 8.5 * 72 - 54, 46)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    c_primary = colors.HexColor("#0F172A")    # Deep Slate
    c_accent = colors.HexColor("#2563EB")     # Enterprise Royal Blue
    c_subtext = colors.HexColor("#475569")    # Slate text
    c_bg_light = colors.HexColor("#F8FAFC")   # Light background
    c_border = colors.HexColor("#E2E8F0")     # Light border

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=c_primary,
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=c_subtext,
        spaceAfter=24
    )

    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=14,
        textColor=c_subtext
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary,
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_accent,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=c_primary,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=c_subtext,
        leftIndent=14,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1E293B"),
        backColor=colors.HexColor("#F1F5F9"),
        borderPadding=6,
        spaceAfter=8
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E3A8A")
    )

    story = []

    # ==================== COVER PAGE ====================
    logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "KapateConsultancy-Logo.png")
    if os.path.exists(logo_path):
        story.append(Image(logo_path, width=180, height=45))
        story.append(Spacer(1, 24))

    story.append(HRFlowable(width="100%", thickness=4, color=c_accent, spaceBefore=10, spaceAfter=20))
    story.append(Paragraph("KAPATE OS", title_style))
    story.append(Paragraph("Enterprise Business Operating System — Operations & Production Deployment Manual", subtitle_style))

    story.append(Spacer(1, 40))

    meta_text = """
    <b>Document Reference:</b> KC-OPS-MAN-2026-V1<br/>
    <b>Release Version:</b> 1.0 (Production Master)<br/>
    <b>Platform:</b> Kapate OS Unified Business Suite<br/>
    <b>Organization:</b> Kapate Consultancy<br/>
    <b>Classification:</b> Confidential / Internal Operational Guide<br/>
    <b>Date:</b> September 2026<br/>
    <b>Lead Architecture:</b> Kapate Technical Architecture & Systems Engineering
    """
    story.append(Paragraph(meta_text, meta_style))

    story.append(Spacer(1, 60))

    # Executive Box on cover
    summary_box_data = [[
        Paragraph("<b>EXECUTIVE NOTICE:</b> This manual contains operational procedures, system access matrices, deployment guides, and disaster recovery runbooks for Kapate OS. Ensure that all deployment credentials and JWT signing keys are managed securely in production environments.", callout_style)
    ]]
    summary_table = Table(summary_box_data, colWidths=[504])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BFDBFE")),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(summary_table)

    story.append(PageBreak())

    # ==================== SECTION 1: ARCHITECTURE ====================
    story.append(Paragraph("1. Executive Summary & System Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "<b>Kapate OS</b> is the proprietary enterprise operating platform designed for <b>Kapate Consultancy</b> to centralize, automate, and scale technology consulting operations. The platform integrates lead acquisition, CRM pipelines, milestone-based project management, employee/intern workforce allocation, automated invoice billing, and an isolated client portal into a unified, secure system.",
        body_style
    ))

    story.append(Paragraph("1.1 Architecture Breakdown", h2_style))
    arch_items = [
        "<b>Presentation Layer (Port 3001):</b> Next.js 16 (React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts Analytics) configured with an executive white theme.",
        "<b>Public Website (Port 3000):</b> High-performance HTML5/CSS3 marketing portal with seamless redirection into Kapate OS.",
        "<b>Application Engine (Port 8000):</b> FastAPI REST engine running asynchronous Python 3.11+ workers with Pydantic v2 schemas and JWT token validation.",
        "<b>Data Storage Layer:</b> SQLAlchemy 2.0 ORM with SQLite in Write-Ahead Logging (WAL) mode or PostgreSQL 15+ with complete foreign-key cascading and immutable audit logs."
    ]
    for item in arch_items:
        story.append(Paragraph(f"• {item}", bullet_style))

    story.append(Spacer(1, 10))

    # Architecture Table
    arch_table_data = [
        [Paragraph("<b>Component</b>", body_style), Paragraph("<b>Technology</b>", body_style), Paragraph("<b>Port / Binding</b>", body_style), Paragraph("<b>Role / Function</b>", body_style)],
        [Paragraph("Kapate OS Frontend", body_style), Paragraph("Next.js 16 / React 19", body_style), Paragraph("localhost:3001", body_style), Paragraph("Interactive enterprise dashboard & modules", body_style)],
        [Paragraph("Main Website", body_style), Paragraph("Vanilla HTML / CSS / JS", body_style), Paragraph("localhost:3000", body_style), Paragraph("Public client acquisition & consulting showcase", body_style)],
        [Paragraph("Core Backend API", body_style), Paragraph("FastAPI / Python 3.11", body_style), Paragraph("localhost:8000", body_style), Paragraph("Business logic, RBAC, JWT auth, database ORM", body_style)],
        [Paragraph("Database", body_style), Paragraph("SQLite (WAL) / PostgreSQL", body_style), Paragraph("File / Port 5432", body_style), Paragraph("Relational storage & audit event streams", body_style)],
    ]
    t_arch = Table(arch_table_data, colWidths=[120, 110, 100, 174])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TEXTCOLOR', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_arch)

    story.append(Spacer(1, 14))

    # ==================== SECTION 2: RBAC & SECURITY ====================
    story.append(Paragraph("2. Role-Based Access Control (RBAC) & Security Policy", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "Kapate OS enforces strict Zero-Trust role authorization. Access permissions are verified at both the API endpoint middleware and frontend UI navigation levels.",
        body_style
    ))

    rbac_table_data = [
        [Paragraph("<b>Role</b>", body_style), Paragraph("<b>CRM</b>", body_style), Paragraph("<b>Projects</b>", body_style), Paragraph("<b>HR / Interns</b>", body_style), Paragraph("<b>Finance</b>", body_style), Paragraph("<b>Client Portal</b>", body_style)],
        [Paragraph("SUPER ADMIN", body_style), Paragraph("Full", body_style), Paragraph("Full", body_style), Paragraph("Full", body_style), Paragraph("Full", body_style), Paragraph("Full Control", body_style)],
        [Paragraph("PROJECT MANAGER", body_style), Paragraph("View/Edit", body_style), Paragraph("Full", body_style), Paragraph("View/Assign", body_style), Paragraph("View Budgets", body_style), Paragraph("View Sprints", body_style)],
        [Paragraph("EMPLOYEE", body_style), Paragraph("Assigned", body_style), Paragraph("Task Work", body_style), Paragraph("Self Clock-in", body_style), Paragraph("Self Claims", body_style), Paragraph("Restricted", body_style)],
        [Paragraph("INTERN", body_style), Paragraph("No Access", body_style), Paragraph("Tasks Only", body_style), Paragraph("Training Hub", body_style), Paragraph("No Access", body_style), Paragraph("No Access", body_style)],
        [Paragraph("FINANCE CONTROLLER", body_style), Paragraph("Deals View", body_style), Paragraph("Budgets", body_style), Paragraph("Payroll View", body_style), Paragraph("Full Invoicing", body_style), Paragraph("No Access", body_style)],
        [Paragraph("CLIENT", body_style), Paragraph("No Access", body_style), Paragraph("No Access", body_style), Paragraph("No Access", body_style), Paragraph("Own Invoices", body_style), Paragraph("Dedicated View", body_style)],
    ]
    t_rbac = Table(rbac_table_data, colWidths=[110, 75, 75, 80, 84, 80])
    t_rbac.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_rbac)

    story.append(Spacer(1, 10))

    security_box_data = [[
        Paragraph("<b>DATA ISOLATION GUARANTEE:</b> Under no circumstances are employee salaries, company gross margins, internal labor hourly costs, or private HR notes exposed to Client accounts. The Client Portal uses an isolated query serializer.", callout_style)
    ]]
    t_sec_box = Table(security_box_data, colWidths=[504])
    t_sec_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#FDE68A")),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_sec_box)

    story.append(PageBreak())

    # ==================== SECTION 3: OPERATIONAL WORKFLOWS ====================
    story.append(Paragraph("3. Step-by-Step Module Operations Guide", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    modules = [
        ("3.1 CRM & Sales Pipeline", [
            "<b>Lead Creation:</b> In the CRM module, click <b>Add Lead</b> to log client information, project scope, budget estimation, and lead source.",
            "<b>Pipeline Movement:</b> Drag or update deals across stages: <i>New Lead -> Discovery Call -> Proposal Sent -> Negotiation -> Contract Won</i>.",
            "<b>Qualification Scoring:</b> System assigns lead scores (1-100) based on budget alignment, technical feasibility, and timeline."
        ]),
        ("3.2 Proposals, Contracts & Digital Signatures", [
            "<b>Generate Proposal:</b> Convert a qualified deal to an executive proposal detailing deliverables, technology stack, and commercial milestones.",
            "<b>E-Signature & Contracts:</b> Once accepted, issue a binding digital contract with audit timestamps and stakeholder signatory tracking."
        ]),
        ("3.3 Project Delivery, Sprints & Kanban Board", [
            "<b>Project Initiation:</b> Create a dedicated project workspace with budget, target delivery date, Project Manager, and allocated team.",
            "<b>Kanban Tasks:</b> Manage sprint tasks across <i>TODO, IN PROGRESS, IN REVIEW, CHANGES REQUESTED, COMPLETED</i>.",
            "<b>Milestone Sign-Off:</b> Complete deliverables to trigger milestone approvals and invoice billing."
        ]),
        ("3.4 Workforce & Dedicated Intern Hub", [
            "<b>Employee Management:</b> Track skill matrices, active project utilization percentages, and engineering capacity.",
            "<b>Intern Mentorship:</b> Mentors evaluate interns across 4 core competencies (Technical execution, Problem-solving, Communication, Milestone delivery).",
            "<b>Certificate Generator:</b> Produce official verifiable <b>Certificate of Completion</b> PDF documents upon internship conclusion."
        ]),
        ("3.5 Time Tracking, Attendance & Leaves", [
            "<b>Daily Attendance:</b> Employees and interns log clock-in and clock-out timestamps with location tags.",
            "<b>Timesheets:</b> Log billable and non-billable hours per project task for manager sign-off.",
            "<b>Leave Requests:</b> Manage sick leave, casual leave, and compensatory off balances with managerial approvals."
        ]),
        ("3.6 Financial Invoicing & Profitability Audits", [
            "<b>Milestone Invoicing:</b> Automatically generate GST-compliant invoices upon milestone completion.",
            "<b>Payment Reconciliation:</b> Log received client bank transfers, transaction IDs, and outstanding balances.",
            "<b>Profitability Audit:</b> Real-time analytics monitor billed revenue vs. actual developer payroll costs and server infrastructure expenses."
        ]),
        ("3.7 Isolated Client Portal", [
            "<b>Client Transparency:</b> External stakeholders access a clean, restricted portal showing project milestones, completed tasks, and invoice download links."
        ])
    ]

    for title, points in modules:
        story.append(Paragraph(title, h2_style))
        for pt in points:
            story.append(Paragraph(f"• {pt}", bullet_style))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ==================== SECTION 4: DEPLOYMENT GUIDE ====================
    story.append(Paragraph("4. Production Deployment & Server Setup Guide", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("4.1 Server Requirements & Prerequisites", h2_style))
    prereqs = [
        "<b>Operating System:</b> Ubuntu 22.04 LTS (64-bit) or Windows Server 2022",
        "<b>Compute Resources:</b> 2 vCPUs, 4 GB RAM, 40 GB NVMe Storage minimum",
        "<b>Runtimes:</b> Node.js 20+ LTS, Python 3.11+, Git, Nginx",
        "<b>Process Managers:</b> Systemd (Backend FastAPI daemon) and PM2 (Next.js frontend daemon)"
    ]
    for p in prereqs:
        story.append(Paragraph(f"• {p}", bullet_style))

    story.append(Spacer(1, 8))

    story.append(Paragraph("4.2 Backend Production Deployment (FastAPI)", h2_style))
    backend_code = """# 1. Setup Python Virtual Environment
cd /var/www/kapate-consultancy/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 2. Configure Systemd Service (/etc/systemd/system/kapate-backend.service)
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
WantedBy=multi-user.target"""
    story.append(Paragraph(backend_code.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))

    story.append(Paragraph("4.3 Frontend Production Deployment (Next.js)", h2_style))
    frontend_code = """# 1. Build Standalone Production Next.js Bundle
cd /var/www/kapate-consultancy/kapate-os-frontend
pnpm install --frozen-lockfile
pnpm build

# 2. Daemonize with PM2 Process Manager
pm2 start npm --name "kapate-os-frontend" -- start -- -p 3001
pm2 save
pm2 startup"""
    story.append(Paragraph(frontend_code.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))

    story.append(Spacer(1, 8))

    story.append(Paragraph("4.4 Nginx Reverse Proxy & SSL Configuration", h2_style))
    nginx_code = """server {
    listen 443 ssl http2;
    server_name os.kapateconsultancy.com;

    ssl_certificate /etc/letsencrypt/live/os.kapateconsultancy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/os.kapateconsultancy.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}"""
    story.append(Paragraph(nginx_code.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))

    story.append(PageBreak())

    # ==================== SECTION 5: MAINTENANCE & BACKUPS ====================
    story.append(Paragraph("5. Database Maintenance, Backups & Runbook", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("5.1 Automated Daily Database Backups", h2_style))
    backup_code = """# Daily cron backup job at 02:00 AM
0 2 * * * cp /var/www/kapate-consultancy/kapate_os.db /var/backups/kapate-os/kapate_os_$(date +\\%Y\\%m\\%d_\\%H\\%M\\%S).db
# Delete backups older than 30 days
0 3 * * * find /var/backups/kapate-os/ -type f -name "*.db" -mtime +30 -delete"""
    story.append(Paragraph(backup_code.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))

    story.append(Spacer(1, 8))

    story.append(Paragraph("5.2 Operational Health Checks & Troubleshooting", h2_style))

    trouble_data = [
        [Paragraph("<b>Issue / Symptom</b>", body_style), Paragraph("<b>Diagnostic Step</b>", body_style), Paragraph("<b>Resolution Procedure</b>", body_style)],
        [Paragraph("API 502 / Offline", body_style), Paragraph("curl http://127.0.0.1:8000/api/v1/health", body_style), Paragraph("Restart backend: sudo systemctl restart kapate-backend", body_style)],
        [Paragraph("Port 3001 in use", body_style), Paragraph("lsof -i :3001 or netstat -ano", body_style), Paragraph("pm2 restart kapate-os-frontend or kill stale process", body_style)],
        [Paragraph("Database Locked", body_style), Paragraph("Check SQLite journal mode", body_style), Paragraph("Enable WAL: PRAGMA journal_mode=WAL;", body_style)],
        [Paragraph("Auth Token Expired", body_style), Paragraph("Inspect JWT header exp", body_style), Paragraph("User re-authenticates or calls refresh token", body_style)],
    ]
    t_trouble = Table(trouble_data, colWidths=[130, 160, 214])
    t_trouble.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_trouble)

    story.append(Spacer(1, 24))

    signoff_text = """
    <b>Approved By:</b> Shon Kapate, Founder & CEO<br/>
    <b>Organization:</b> Kapate Consultancy (AI, ML & Enterprise Software Engineering)<br/>
    <b>Document Status:</b> Official Production Baseline (v1.0)<br/>
    <b>Support & Incident Escalation:</b> support@kapateconsultancy.in
    """
    story.append(Paragraph(signoff_text, meta_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF manual at: {filename}")

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_pdf_root = os.path.join(out_dir, "Kapate_OS_Operations_Manual.pdf")
    target_pdf_docs = os.path.join(out_dir, "docs", "Kapate_OS_Operations_Manual.pdf")
    
    os.makedirs(os.path.join(out_dir, "docs"), exist_ok=True)
    build_pdf(target_pdf_root)
    build_pdf(target_pdf_docs)
