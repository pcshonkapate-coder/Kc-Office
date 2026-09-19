import sys
import uuid
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models import (
    User, OTPToken, Role, Permission, RolePermission, UserRole, Department, Employee, Intern, Freelancer, Attendance, LeaveRequest, Timesheet,
    Service, Company, Contact, Lead, Deal, DealStageHistory, DealContact, Activity,
    Project, Milestone, Task, Subtask, DeliveryComment, ResourceAllocation,
    Invoice, InvoiceItem, Payment, Expense, Document, Notification, AuditLog, ActivityEvent,
    KapateIdSequence, RegistrationRequest, OnboardingInvitation
)
from app.models.document import ManagedDocument, DocumentVersion, SignatureTracker
from app.core.security import get_password_hash
from app.core.config import settings
from app.core.logging import logger
from datetime import datetime, timezone, date, timedelta
from decimal import Decimal
from sqlalchemy import text


STANDARD_ROLES = [
    ("superadmin", "Unrestricted system-wide control across all operations", True),
    ("partner", "Executive leadership: all CRM, high-level financials, contracts", True),
    ("consultant", "Advisory practice: proposals, assigned client projects, timesheets", True),
    ("engineer", "Technical delivery: project tasks, timesheet logging", True),
    ("intern", "Learning & development: assigned tasks, attendance", True),
    ("freelancer", "External contractor: assigned tasks, invoices", True),
    ("client", "Client portal access: milestones and invoice status", True),
]

STANDARD_PERMISSIONS = [
    ("crm:leads:read", "crm", "View incoming and qualified leads"),
    ("crm:leads:write", "crm", "Create, edit, and qualify leads"),
    ("crm:leads:delete", "crm", "Delete lead records"),
    ("crm:deals:read", "crm", "View deal pipeline and opportunities"),
    ("crm:deals:write", "crm", "Create and progress sales deals"),
    ("crm:deals:delete", "crm", "Delete deal records"),
    ("crm:companies:read", "crm", "View client organization profiles"),
    ("crm:companies:write", "crm", "Create and update client organizations"),
    ("crm:companies:delete", "crm", "Delete client organization records"),
    ("crm:contacts:read", "crm", "View client contact directory"),
    ("crm:contacts:write", "crm", "Create and edit client contacts"),
    ("crm:contacts:delete", "crm", "Delete client contact records"),
    ("crm:services:read", "crm", "View configurable consultancy services"),
    ("crm:services:manage", "crm", "Configure, create, and update consultancy services"),
    ("crm:analytics:read", "crm", "View real-time CRM performance analytics and reports"),
    ("crm:contracts:sign", "crm", "Authorize and sign legal contracts and SOWs"),
    ("workforce:directory:read", "workforce", "View internal staff directory"),
    ("workforce:timesheets:submit", "workforce", "Submit timesheet hours"),
    ("workforce:timesheets:approve", "workforce", "Approve subordinate timesheets"),
    ("projects:read", "delivery", "View client project boards"),
    ("projects:manage", "delivery", "Create and manage projects and milestones"),
    ("tasks:update", "delivery", "Update task progress and comments"),
    ("finance:invoices:read", "finance", "View client invoices"),
    ("finance:invoices:create", "finance", "Generate client billing invoices"),
    ("finance:expenses:submit", "finance", "Submit business expenditures"),
    ("system:audit:read", "system", "Inspect immutable security audit ledger"),
    ("system:users:manage", "system", "Create and modify user roles and access"),
]

INITIAL_SERVICES = [
    ("AI Development", "ai_development", "End-to-end custom artificial intelligence solutions and LLM integrations", "AI & Data"),
    ("Machine Learning", "machine_learning", "Predictive modeling, deep learning pipelines, and computer vision models", "AI & Data"),
    ("Custom Software Development", "custom_software", "Tailor-made scalable software platforms and business applications", "Engineering"),
    ("Web Development", "web_development", "High-performance enterprise web apps and cloud portals", "Engineering"),
    ("Mobile Development", "mobile_development", "Native and cross-platform iOS and Android enterprise mobile applications", "Engineering"),
    ("Data Engineering", "data_engineering", "ETL pipelines, data warehousing, lakehouses, and real-time streaming", "AI & Data"),
    ("Cloud Solutions", "cloud_solutions", "AWS, Azure, and GCP architecture, cloud migration, and FinOps", "Cloud & DevOps"),
    ("Automation", "automation", "Robotic process automation (RPA), workflow orchestration, and CI/CD", "Cloud & DevOps"),
    ("AI Consulting", "ai_consulting", "Strategic advisory on AI readiness, architecture, and technology roadmap", "Advisory"),
    ("IT Consulting", "it_consulting", "Enterprise IT transformation, compliance, and systems modernization", "Advisory"),
    ("Enterprise Solutions", "enterprise_solutions", "ERP, CRM, and mission-critical multi-tenant software deployments", "Engineering"),
]


def migrate_schema(db_engine):
    """Safely apply column additions for all tables in SQLAlchemy Base.metadata."""
    from sqlalchemy import inspect
    inspector = inspect(db_engine)
    with db_engine.connect() as conn:
        for table_name, table in Base.metadata.tables.items():
            if not inspector.has_table(table_name):
                continue
            existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
            for col in table.columns:
                if col.name not in existing_cols:
                    col_type = str(col.type.compile(db_engine.dialect))
                    try:
                        logger.info(f"Auto-migrating column '{col.name}' ({col_type}) to table '{table_name}'")
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type}"))
                        conn.commit()
                    except Exception as ex:
                        logger.warning(f"Could not add {col.name} to {table_name}: {ex}")

        # Backfill aliases if needed
        try:
            conn.execute(text("UPDATE companies SET tax_id = gst_number WHERE tax_id IS NULL AND gst_number IS NOT NULL"))
            conn.execute(text("UPDATE contacts SET job_title = designation WHERE job_title IS NULL AND designation IS NOT NULL"))
            conn.execute(text("UPDATE leads SET name = contact_name WHERE name IS NULL AND contact_name IS NOT NULL"))
            conn.execute(text("UPDATE leads SET budget = budget_range WHERE budget IS NULL AND budget_range IS NOT NULL"))
            conn.execute(text("UPDATE leads SET project_description = brief WHERE project_description IS NULL AND brief IS NOT NULL"))
            conn.execute(text("UPDATE leads SET lead_code = 'LD-' || SUBSTR(id, 1, 8) WHERE lead_code IS NULL"))
            conn.commit()
        except Exception:
            pass


def init_db():
    logger.info("Initializing Kapate OS database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Running schema migration check for SQLite tables...")
    migrate_schema(engine)
    logger.info("All normalized relational tables confirmed.")

    db = SessionLocal()
    try:
        # 1. Seed Roles
        role_map = {}
        for name, desc, is_sys in STANDARD_ROLES:
            existing = db.query(Role).filter(Role.name == name).first()
            if not existing:
                role = Role(name=name, description=desc, is_system=is_sys)
                db.add(role)
                db.flush()
                role_map[name] = role
                logger.info(f"Seeded role: '{name}'")
            else:
                role_map[name] = existing

        # 1.1 Seed KapateIdSequence counters
        for pfx in ["EMP", "INT", "FRL"]:
            existing_seq = db.query(KapateIdSequence).filter(KapateIdSequence.entity_type == pfx).first()
            if not existing_seq:
                db.add(KapateIdSequence(entity_type=pfx, current_number=0))
                db.flush()
        perm_map = {}
        for code, module, desc in STANDARD_PERMISSIONS:
            existing = db.query(Permission).filter(Permission.code == code).first()
            if not existing:
                perm = Permission(code=code, module=module, description=desc)
                db.add(perm)
                db.flush()
                perm_map[code] = perm
            else:
                perm_map[code] = existing
        logger.info(f"Seeded {len(perm_map)} standard permissions.")

        # 3. Associate Permissions to Superadmin & Partner
        superadmin_role = role_map["superadmin"]
        existing_rp = {
            rp.permission_id for rp in db.query(RolePermission).filter(RolePermission.role_id == superadmin_role.id).all()
        }
        for perm in perm_map.values():
            if perm.id not in existing_rp:
                db.add(RolePermission(role_id=superadmin_role.id, permission_id=perm.id))

        partner_role = role_map.get("partner")
        if partner_role:
            partner_perms = [
                "crm:leads:read", "crm:leads:write", "crm:deals:read", "crm:deals:write",
                "crm:companies:read", "crm:companies:write", "crm:contacts:read", "crm:contacts:write",
                "crm:services:read", "crm:services:manage", "crm:analytics:read", "crm:contracts:sign",
                "projects:read", "finance:invoices:read", "finance:invoices:create"
            ]
            p_existing = {
                rp.permission_id for rp in db.query(RolePermission).filter(RolePermission.role_id == partner_role.id).all()
            }
            for code in partner_perms:
                p = perm_map.get(code)
                if p and p.id not in p_existing:
                    db.add(RolePermission(role_id=partner_role.id, permission_id=p.id))

        # 4. Associate Permissions to Consultant
        consultant_role = role_map["consultant"]
        consultant_perms = [
            "crm:leads:read", "crm:leads:write", "crm:deals:read", "crm:deals:write",
            "crm:companies:read", "crm:contacts:read", "crm:services:read", "crm:analytics:read",
            "workforce:directory:read", "workforce:timesheets:submit", "projects:read", "tasks:update",
            "finance:expenses:submit"
        ]
        c_existing_rp = {
            rp.permission_id for rp in db.query(RolePermission).filter(RolePermission.role_id == consultant_role.id).all()
        }
        for code in consultant_perms:
            p = perm_map.get(code)
            if p and p.id not in c_existing_rp:
                db.add(RolePermission(role_id=consultant_role.id, permission_id=p.id))

        # 5. Seed Default Department
        dept = db.query(Department).filter(Department.code == "TECH_AI").first()
        if not dept:
            dept = Department(name="AI & Engineering Solutions", code="TECH_AI")
            db.add(dept)
            logger.info("Seeded department: 'AI & Engineering Solutions'")

        # 6. Seed Initial Superadmin User
        admin_email = settings.FIRST_SUPERADMIN_EMAIL.lower().strip()
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash(settings.FIRST_SUPERADMIN_PASSWORD),
                full_name=settings.FIRST_SUPERADMIN_NAME,
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)
            db.flush()

            # Assign Superadmin role
            db.add(UserRole(user_id=admin_user.id, role_id=superadmin_role.id))
            logger.info(f"Seeded superadmin account: '{admin_email}'")
        else:
            logger.info(f"Superadmin '{admin_email}' already exists.")

        # 7. Seed Configurable Services
        service_map = {}
        for name, code, desc, cat in INITIAL_SERVICES:
            existing_service = db.query(Service).filter((Service.code == code) | (Service.name == name)).first()
            if not existing_service:
                svc = Service(name=name, code=code, description=desc, category=cat, is_active=True)
                db.add(svc)
                db.flush()
                service_map[code] = svc
                logger.info(f"Seeded service: '{name}'")
            else:
                service_map[code] = existing_service

        # 8. Seed Initial Companies & Contacts if empty
        if db.query(Company).count() == 0:
            c1 = Company(
                name="InnovateTech Pvt Ltd",
                domain="innovatetech.in",
                industry="FinTech",
                website="https://innovatetech.in",
                gst_number="27AAACI1681G1Z0",
                tax_id="27AAACI1681G1Z0",
                company_size="51-200",
                source="Referral",
                address="Level 5, Cyber Park, Bandra Kurla Complex",
                city="Mumbai",
                country="India",
                notes="Leading wealth-management platform upgrading to AI risk assessment"
            )
            c2 = Company(
                name="RetailOS Solutions",
                domain="retailos.com",
                industry="Retail & E-commerce",
                website="https://retailos.com",
                gst_number="29AABCR8821K1ZZ",
                tax_id="29AABCR8821K1ZZ",
                company_size="201-500",
                source="Website contact form",
                address="Indiranagar 100ft Road",
                city="Bengaluru",
                country="India",
                notes="Omnichannel retail management seeking real-time cloud data warehouse"
            )
            c3 = Company(
                name="HealthTrack Global",
                domain="healthtrack.co",
                industry="Healthcare & Life Sciences",
                website="https://healthtrack.co",
                gst_number="36AAGCH9923P1ZQ",
                tax_id="36AAGCH9923P1ZQ",
                company_size="500+",
                source="LinkedIn",
                address="HITEC City, Madhapur",
                city="Hyderabad",
                country="India",
                notes="Large hospital network integrating predictive patient diagnostics"
            )
            c4 = Company(
                name="FinServe Edge",
                domain="finserveedge.io",
                industry="Banking & Financial Services",
                website="https://finserveedge.io",
                tax_id="US982314981",
                company_size="11-50",
                source="Cold outreach",
                address="Financial District",
                city="New York",
                country="United States",
                notes="Algorithmic trading firm requiring ultra-low-latency ML pipelines"
            )
            db.add_all([c1, c2, c3, c4])
            db.flush()

            # Contacts
            ct1 = Contact(
                company_id=c1.id,
                name="Arjun Mehta",
                email="arjun.mehta@innovatetech.in",
                phone="+91 98234 56789",
                job_title="Chief Technology Officer",
                designation="CTO",
                role_in_buying_process="CTO",
                is_primary=True,
                notes="Primary technical decision maker"
            )
            ct2 = Contact(
                company_id=c1.id,
                name="Siddharth Rao",
                email="siddharth.rao@innovatetech.in",
                phone="+91 98234 11223",
                job_title="VP Finance & Procurement",
                designation="VP Finance",
                role_in_buying_process="Finance",
                is_primary=False,
                notes="Signs commercial agreements"
            )
            ct3 = Contact(
                company_id=c2.id,
                name="Priya Sharma",
                email="priya.sharma@retailos.com",
                phone="+91 88234 12345",
                job_title="VP of Product",
                designation="VP Product",
                role_in_buying_process="VP Product",
                is_primary=True,
                notes="Product champion driving modernization"
            )
            ct4 = Contact(
                company_id=c3.id,
                name="Dr. Rajan Pillai",
                email="rajan.pillai@healthtrack.co",
                phone="+91 77234 98765",
                job_title="Chief Information Officer",
                designation="CIO",
                role_in_buying_process="Technical Lead",
                is_primary=True,
                notes="Interested in HIPAA-compliant model training"
            )
            ct5 = Contact(
                company_id=c4.id,
                name="Michael Vance",
                email="mvance@finserveedge.io",
                phone="+1 212 555 0192",
                job_title="Chief Executive Officer",
                designation="CEO",
                role_in_buying_process="CEO",
                is_primary=True,
                notes="Direct sponsor"
            )
            db.add_all([ct1, ct2, ct3, ct4, ct5])
            db.flush()

            # Deals across pipeline stages
            svc_ai = service_map.get("ai_development")
            svc_ml = service_map.get("machine_learning")
            svc_cloud = service_map.get("cloud_solutions")

            today = date.today()

            d1 = Deal(
                company_id=c1.id,
                primary_contact_id=ct1.id,
                service_id=svc_ai.id if svc_ai else None,
                title="AI Risk Assessment Engine",
                pipeline_stage="PROPOSAL / SOW",
                estimated_value=Decimal("8500000.00"),
                currency="INR",
                expected_close_date=today + timedelta(days=25),
                win_probability=65,
                owner_user_id=admin_user.id,
                notes="Scope finalized. SOW version 2 presented to Arjun and VP Finance."
            )
            d2 = Deal(
                company_id=c2.id,
                primary_contact_id=ct3.id,
                service_id=svc_cloud.id if svc_cloud else None,
                title="Cloud Migration & Data Lakehouse",
                pipeline_stage="NEGOTIATION",
                estimated_value=Decimal("12000000.00"),
                currency="INR",
                expected_close_date=today + timedelta(days=14),
                win_probability=80,
                owner_user_id=admin_user.id,
                notes="Negotiating 2-year maintenance retainer clause."
            )
            d3 = Deal(
                company_id=c3.id,
                primary_contact_id=ct4.id,
                service_id=svc_ml.id if svc_ml else None,
                title="Predictive Clinical Diagnostics Platform",
                pipeline_stage="TECHNICAL ASSESSMENT",
                estimated_value=Decimal("14500000.00"),
                currency="INR",
                expected_close_date=today + timedelta(days=45),
                win_probability=45,
                owner_user_id=admin_user.id,
                notes="Technical architecture review scheduled with hospital data team."
            )
            d4 = Deal(
                company_id=c4.id,
                primary_contact_id=ct5.id,
                service_id=svc_ml.id if svc_ml else None,
                title="Ultra-Low Latency ML Inference Engine",
                pipeline_stage="CLOSED WON",
                estimated_value=Decimal("18500000.00"),
                currency="INR",
                expected_close_date=today - timedelta(days=5),
                win_probability=100,
                owner_user_id=admin_user.id,
                notes="MSA and SOW executed. Initial advance invoice approved."
            )
            db.add_all([d1, d2, d3, d4])
            db.flush()

            # Deal stage history
            hist1 = DealStageHistory(deal_id=d1.id, from_stage="DISCOVERY COMPLETED", to_stage="PROPOSAL / SOW", notes="Proposal delivered", changed_by_user_id=admin_user.id)
            hist2 = DealStageHistory(deal_id=d2.id, from_stage="PROPOSAL / SOW", to_stage="NEGOTIATION", notes="Pricing discount agreed upon", changed_by_user_id=admin_user.id)
            hist3 = DealStageHistory(deal_id=d4.id, from_stage="NEGOTIATION", to_stage="CLOSED WON", notes="Executed contract received", changed_by_user_id=admin_user.id)
            db.add_all([hist1, hist2, hist3])

            # Initial Leads
            l1 = Lead(
                lead_code="LD-1001",
                name="Ananya Verma",
                contact_name="Ananya Verma",
                company_name="Apex Logistics Tech",
                email="ananya@apexlogistics.in",
                phone="+91 99887 66554",
                country="India",
                city="Pune",
                job_title="Director of Operations",
                service_interest="Automation",
                service_id=service_map.get("automation", svc_ai).id if service_map.get("automation") else None,
                budget="₹30L - ₹50L",
                budget_range="₹30L - ₹50L",
                currency="INR",
                project_description="Warehouse automation and automated OCR routing for shipping manifests.",
                source="Website contact form",
                priority="high",
                lead_score=85,
                assigned_salesperson_id=admin_user.id,
                status="QUALIFICATION",
                next_follow_up_at=datetime.now(timezone.utc) + timedelta(days=2),
                notes="Responded within 30 minutes of web submission."
            )
            l2 = Lead(
                lead_code="LD-1002",
                name="Marcus Thorne",
                contact_name="Marcus Thorne",
                company_name="Nordic Energy Analytics",
                email="marcus@nordicenergy.se",
                phone="+46 8 123 4567",
                country="Sweden",
                city="Stockholm",
                job_title="Head of Smart Grid Innovation",
                service_interest="Machine Learning",
                service_id=svc_ml.id if svc_ml else None,
                budget="€50,000 - €100,000",
                budget_range="€50,000 - €100,000",
                currency="EUR",
                project_description="Real-time wind turbine vibration anomaly prediction.",
                source="LinkedIn",
                priority="urgent",
                lead_score=92,
                assigned_salesperson_id=admin_user.id,
                status="NEW LEAD",
                notes="Inbound message via Kapate LinkedIn corporate page."
            )
            l3 = Lead(
                lead_code="LD-1003",
                name="Vikram Sethi",
                contact_name="Vikram Sethi",
                company_name="QuickMart Grocery",
                email="vikram@quickmart.in",
                phone="+91 91122 33445",
                country="India",
                city="Delhi",
                job_title="Co-Founder & COO",
                service_interest="Mobile Development",
                service_id=service_map.get("mobile_development", svc_ai).id if service_map.get("mobile_development") else None,
                budget="₹15L - ₹25L",
                budget_range="₹15L - ₹25L",
                currency="INR",
                project_description="Quick commerce delivery partner app with real-time routing.",
                source="Referral",
                priority="medium",
                lead_score=68,
                assigned_salesperson_id=admin_user.id,
                status="DISCOVERY BOOKED",
                next_follow_up_at=datetime.now(timezone.utc) + timedelta(days=3),
                notes="Referred by Arjun Mehta from InnovateTech."
            )
            db.add_all([l1, l2, l3])
            db.flush()

            # Activities
            act1 = Activity(
                entity_type="deal",
                entity_id=d1.id,
                activity_type="call",
                subject="Technical Q&A Call",
                notes="Addressed data residency concerns and GPU compute sizing requirements.",
                status="completed",
                completed_at=datetime.now(timezone.utc) - timedelta(days=1),
                created_by_user_id=admin_user.id
            )
            act2 = Activity(
                entity_type="lead",
                entity_id=l1.id,
                activity_type="email",
                subject="Introductory Capability Deck Sent",
                notes="Sent Kapate AI & Automation brochure with case studies.",
                status="completed",
                completed_at=datetime.now(timezone.utc) - timedelta(hours=4),
                created_by_user_id=admin_user.id
            )
            db.add_all([act1, act2])
            db.flush()

            # Workforce Departments
            dept_eng = db.query(Department).filter(Department.code == "ENG").first()
            if not dept_eng:
                dept_eng = Department(id=str(uuid.uuid4()), name="Engineering", code="ENG")
                dept_del = Department(id=str(uuid.uuid4()), name="Delivery", code="DEL")
                dept_cns = Department(id=str(uuid.uuid4()), name="Consulting", code="CNS")
                dept_dsn = Department(id=str(uuid.uuid4()), name="Design", code="DSN")
                dept_anl = Department(id=str(uuid.uuid4()), name="Analytics", code="ANL")
                dept_hr = Department(id=str(uuid.uuid4()), name="HR", code="HR")
                db.add_all([dept_eng, dept_del, dept_cns, dept_dsn, dept_anl, dept_hr])
                db.flush()
            else:
                dept_del = db.query(Department).filter(Department.code == "DEL").first()
                dept_cns = db.query(Department).filter(Department.code == "CNS").first()
                dept_dsn = db.query(Department).filter(Department.code == "DSN").first()
                dept_anl = db.query(Department).filter(Department.code == "ANL").first()
                dept_hr = db.query(Department).filter(Department.code == "HR").first()

            # Staff Users & Employees
            def create_staff_user(email, first, last, phone, role_name):
                u = db.query(User).filter(User.email == email).first()
                if not u:
                    u = User(
                        id=str(uuid.uuid4()),
                        email=email,
                        full_name=f"{first} {last}".strip(),
                        phone=phone,
                        hashed_password=get_password_hash("KapateOS@2026!"),
                        is_active=True,
                        is_verified=True,
                    )
                    db.add(u)
                    db.flush()
                    role = db.query(Role).filter(Role.name == role_name).first()
                    if role:
                        db.add(UserRole(user_id=u.id, role_id=role.id))
                        db.flush()
                return u

            u_vikram = create_staff_user("vikram@kapateconsultancy.in", "Vikram", "Nair", "+91 98234 11111", "consultant")
            u_priya = create_staff_user("priya@kapateconsultancy.in", "Priya", "Sharma", "+91 98234 22222", "engineer")
            u_karan = create_staff_user("karan@kapateconsultancy.in", "Karan", "Singh", "+91 98234 33333", "engineer")
            u_divya = create_staff_user("divya@kapateconsultancy.in", "Divya", "Rao", "+91 98234 44444", "consultant")
            u_sneha = create_staff_user("sneha@kapateconsultancy.in", "Sneha", "Patel", "+91 98234 55555", "engineer")
            u_rohan = create_staff_user("rohan.intern@kapateconsultancy.in", "Rohan", "Kumar", "+91 77234 11111", "intern")
            u_aishwarya = create_staff_user("aishwarya.intern@kapateconsultancy.in", "Aishwarya", "Menon", "+91 77234 22222", "intern")
            u_alex = create_staff_user("alex.carter@freelance.com", "Alex", "Carter", "+1 555 123 4567", "freelancer")

            if not db.query(Employee).first():
                e1 = Employee(
                    id=str(uuid.uuid4()), user_id=u_vikram.id, department_id=dept_del.id,
                    name=u_vikram.full_name, email=u_vikram.email,
                    phone=u_vikram.phone, employee_id="EMP-001", designation="Senior Project Manager",
                    employment_type="full_time", joining_date=date(2024, 1, 15)
                )
                e2 = Employee(
                    id=str(uuid.uuid4()), user_id=u_priya.id, department_id=dept_eng.id,
                    name=u_priya.full_name, email=u_priya.email,
                    phone=u_priya.phone, employee_id="EMP-002", designation="Full-Stack Engineer",
                    employment_type="full_time", joining_date=date(2024, 3, 1)
                )
                e3 = Employee(
                    id=str(uuid.uuid4()), user_id=u_karan.id, department_id=dept_eng.id,
                    name=u_karan.full_name, email=u_karan.email,
                    phone=u_karan.phone, employee_id="EMP-003", designation="DevOps Architect",
                    employment_type="full_time", joining_date=date(2023, 11, 20)
                )
                e4 = Employee(
                    id=str(uuid.uuid4()), user_id=u_divya.id, department_id=dept_cns.id,
                    name=u_divya.full_name, email=u_divya.email,
                    phone=u_divya.phone, employee_id="EMP-004", designation="Business Analyst",
                    employment_type="full_time", joining_date=date(2024, 6, 1)
                )
                e5 = Employee(
                    id=str(uuid.uuid4()), user_id=u_sneha.id, department_id=dept_dsn.id,
                    name=u_sneha.full_name, email=u_sneha.email,
                    phone=u_sneha.phone, employee_id="EMP-005", designation="UI/UX Designer",
                    employment_type="full_time", joining_date=date(2025, 1, 10)
                )
                db.add_all([e1, e2, e3, e4, e5])
                db.flush()

                i1 = Intern(
                    id=str(uuid.uuid4()), user_id=u_rohan.id, department_id=dept_eng.id,
                    name=u_rohan.full_name, email=u_rohan.email,
                    phone=u_rohan.phone, intern_id="INT-001", designation="Software Engineering Intern",
                    start_date=date(2026, 7, 1), internship_status="ACTIVE"
                )
                i2 = Intern(
                    id=str(uuid.uuid4()), user_id=u_aishwarya.id, department_id=dept_anl.id,
                    name=u_aishwarya.full_name, email=u_aishwarya.email,
                    phone=u_aishwarya.phone, intern_id="INT-002", designation="Data Analytics Intern",
                    start_date=date(2026, 7, 1), internship_status="ACTIVE"
                )
                f1 = Freelancer(
                    id=str(uuid.uuid4()), user_id=u_alex.id,
                    name=u_alex.full_name, email=u_alex.email,
                    phone=u_alex.phone, designation="iOS Developer", rate=Decimal("3500.00"), currency="INR"
                )
                db.add_all([i1, i2, f1])
                db.flush()

                # Attendance for today
                for u in [u_vikram, u_priya, u_karan, u_sneha, u_rohan]:
                    db.add(Attendance(id=str(uuid.uuid4()), user_id=u.id, date=date.today(), check_in=datetime.now(timezone.utc) - timedelta(hours=4), status="present"))

                # Leave requests
                db.add(LeaveRequest(id=str(uuid.uuid4()), user_id=u_divya.id, leave_type="casual", start_date=date.today(), end_date=date.today() + timedelta(days=1), reason="Family event", status="approved", approved_by_user_id=admin_user.id))
                db.add(LeaveRequest(id=str(uuid.uuid4()), user_id=u_priya.id, leave_type="sick", start_date=date.today() + timedelta(days=5), end_date=date.today() + timedelta(days=6), reason="Doctor appointment", status="pending"))
                db.flush()

            # Projects
            if not db.query(Project).first():
                p1 = Project(id=str(uuid.uuid4()), company_id=c1.id, project_code="KAP-001", name="Project Nexus", description="Enterprise AI & ERP Transformation", project_type="fixed_bid", status="active", budget=Decimal("8500000.00"), currency="INR", start_date=date(2026, 6, 1), end_date=date(2026, 10, 30), project_manager_id=u_vikram.id)
                p2 = Project(id=str(uuid.uuid4()), company_id=c2.id, project_code="KAP-002", name="RetailOS Cloud", description="Cloud Migration & Scalable Store Architecture", project_type="time_and_materials", status="active", budget=Decimal("12000000.00"), currency="INR", start_date=date(2026, 7, 15), end_date=date(2026, 12, 31), project_manager_id=u_priya.id)
                p3 = Project(id=str(uuid.uuid4()), company_id=c3.id, project_code="KAP-003", name="HealthTrack Analytics", description="Clinical Predictive Modeling & Analytics", project_type="retainer", status="on_hold", budget=Decimal("4500000.00"), currency="INR", start_date=date(2026, 5, 1), end_date=date(2026, 11, 30), project_manager_id=u_vikram.id)
                p4 = Project(id=str(uuid.uuid4()), company_id=c1.id, project_code="KAP-004", name="EduPlatform Mobile", description="Interactive Learning Native Mobile Applications", project_type="fixed_bid", status="active", budget=Decimal("2800000.00"), currency="INR", start_date=date(2026, 8, 1), end_date=date(2026, 11, 15), project_manager_id=u_sneha.id)
                p5 = Project(id=str(uuid.uuid4()), company_id=c4.id, project_code="KAP-005", name="FinServe DevOps", description="Ultra-Reliable Financial CI/CD Infrastructure", project_type="fixed_bid", status="completed", budget=Decimal("6200000.00"), currency="INR", start_date=date(2026, 3, 1), end_date=date(2026, 8, 31), project_manager_id=u_karan.id)
                p6 = Project(id=str(uuid.uuid4()), company_id=c2.id, project_code="KAP-006", name="ManufacturePro CRM", description="Specialized B2B Equipment Sales CRM", project_type="time_and_materials", status="active", budget=Decimal("1900000.00"), currency="INR", start_date=date(2026, 9, 1), end_date=date(2026, 12, 15), project_manager_id=u_divya.id)
                db.add_all([p1, p2, p3, p4, p5, p6])
                db.flush()

                # Milestones
                m1 = Milestone(id=str(uuid.uuid4()), project_id=p1.id, title="Phase 1: Architecture Audit & Ingestion Engine", due_date=date(2026, 7, 31), deliverable_summary="Complete ETL pipeline and system audit", amount=Decimal("3500000.00"), status="approved")
                m2 = Milestone(id=str(uuid.uuid4()), project_id=p1.id, title="Phase 2: Core ML Forecasting Models", due_date=date(2026, 9, 18), deliverable_summary="Inference pipeline deployed to staging", amount=Decimal("2500000.00"), status="in_progress")
                m3 = Milestone(id=str(uuid.uuid4()), project_id=p1.id, title="Phase 3: Production Hardening & Handover", due_date=date(2026, 10, 30), deliverable_summary="Final security audit and knowledge transfer", amount=Decimal("2500000.00"), status="pending")
                db.add_all([m1, m2, m3])
                db.flush()

                # Tasks
                t1 = Task(id=str(uuid.uuid4()), project_id=p1.id, milestone_id=m2.id, title="Integrate payment gateway API", description="Set up Razorpay and Stripe webhooks with idempotency keys", priority="high", status="in_progress", estimated_hours=Decimal("24.0"), actual_hours=Decimal("16.0"), assigned_to_user_id=u_priya.id)
                t2 = Task(id=str(uuid.uuid4()), project_id=p2.id, title="Write unit tests for auth module", description="Cover edge cases in JWT refresh and RBAC guards", priority="medium", status="todo", estimated_hours=Decimal("16.0"), actual_hours=Decimal("4.0"), assigned_to_user_id=u_karan.id)
                t3 = Task(id=str(uuid.uuid4()), project_id=p4.id, title="Design dashboard wireframes v2", description="High-fidelity Figma prototypes for tablet screens", priority="medium", status="review", estimated_hours=Decimal("30.0"), actual_hours=Decimal("28.0"), assigned_to_user_id=u_sneha.id)
                t4 = Task(id=str(uuid.uuid4()), project_id=p3.id, title="Deploy staging environment", description="Terraform provision ECS cluster and RDS Postgres instance", priority="high", status="todo", estimated_hours=Decimal("20.0"), actual_hours=Decimal("0.0"), assigned_to_user_id=u_karan.id)
                t5 = Task(id=str(uuid.uuid4()), project_id=p6.id, title="Client requirement gathering session", description="Document manufacturing line sensor telemetry formats", priority="low", status="done", estimated_hours=Decimal("12.0"), actual_hours=Decimal("12.0"), assigned_to_user_id=u_divya.id)
                t6 = Task(id=str(uuid.uuid4()), project_id=p1.id, milestone_id=m2.id, title="Optimize database queries for reports", description="Add index on tenant_id, timestamp and cache aggregated views", priority="high", status="in_progress", estimated_hours=Decimal("18.0"), actual_hours=Decimal("10.0"), assigned_to_user_id=u_rohan.id)
                db.add_all([t1, t2, t3, t4, t5, t6])
                db.flush()

                # Resource Allocations
                db.add(ResourceAllocation(id=str(uuid.uuid4()), project_id=p1.id, user_id=u_vikram.id, role_in_project="Project Manager", allocation_percentage=50, start_date=date(2026, 6, 1)))
                db.add(ResourceAllocation(id=str(uuid.uuid4()), project_id=p1.id, user_id=u_priya.id, role_in_project="Lead Engineer", allocation_percentage=100, start_date=date(2026, 6, 1)))
                db.add(ResourceAllocation(id=str(uuid.uuid4()), project_id=p1.id, user_id=u_rohan.id, role_in_project="Backend Intern", allocation_percentage=100, start_date=date(2026, 7, 1)))
                db.add(ResourceAllocation(id=str(uuid.uuid4()), project_id=p2.id, user_id=u_karan.id, role_in_project="Cloud Architect", allocation_percentage=80, start_date=date(2026, 7, 15)))
                db.flush()

                # Timesheets
                db.add(Timesheet(id=str(uuid.uuid4()), user_id=u_priya.id, project_id=p1.id, task_id=t1.id, date=date.today(), hours_spent=Decimal("6.5"), is_billable=True, description="Implemented webhook validation logic", status="approved", approved_by_user_id=u_vikram.id))
                db.add(Timesheet(id=str(uuid.uuid4()), user_id=u_rohan.id, project_id=p1.id, task_id=t6.id, date=date.today(), hours_spent=Decimal("5.0"), is_billable=True, description="Analyzed slow query logs in Postgres", status="submitted"))
                db.flush()

                # Invoices
                inv1 = Invoice(id=str(uuid.uuid4()), company_id=c1.id, project_id=p1.id, invoice_number="INV-0042", invoice_date=date(2026, 9, 1), due_date=date(2026, 9, 15), subtotal=Decimal("2118644.07"), tax_rate=Decimal("18.00"), tax_amount=Decimal("381355.93"), total_amount=Decimal("2500000.00"), currency="INR", status="overdue")
                inv2 = Invoice(id=str(uuid.uuid4()), company_id=c2.id, project_id=p2.id, invoice_number="INV-0041", invoice_date=date(2026, 8, 25), due_date=date(2026, 9, 25), subtotal=Decimal("3559322.03"), tax_rate=Decimal("18.00"), tax_amount=Decimal("640677.97"), total_amount=Decimal("4200000.00"), currency="INR", status="sent")
                inv3 = Invoice(id=str(uuid.uuid4()), company_id=c4.id, project_id=p5.id, invoice_number="INV-0040", invoice_date=date(2026, 8, 31), due_date=date(2026, 9, 10), subtotal=Decimal("5169491.53"), tax_rate=Decimal("18.00"), tax_amount=Decimal("930508.47"), total_amount=Decimal("6100000.00"), currency="INR", status="paid")
                inv4 = Invoice(id=str(uuid.uuid4()), company_id=c1.id, project_id=p4.id, invoice_number="INV-0039", invoice_date=date(2026, 8, 15), due_date=date(2026, 8, 30), subtotal=Decimal("1186440.68"), tax_rate=Decimal("18.00"), tax_amount=Decimal("213559.32"), total_amount=Decimal("1400000.00"), currency="INR", status="paid")
                inv5 = Invoice(id=str(uuid.uuid4()), company_id=c3.id, project_id=p3.id, invoice_number="INV-0038", invoice_date=date(2026, 8, 1), due_date=date(2026, 8, 15), subtotal=Decimal("635593.22"), tax_rate=Decimal("18.00"), tax_amount=Decimal("114406.78"), total_amount=Decimal("750000.00"), currency="INR", status="paid")
                inv6 = Invoice(id=str(uuid.uuid4()), company_id=c2.id, project_id=p6.id, invoice_number="INV-0037", invoice_date=date(2026, 9, 10), due_date=date(2026, 9, 30), subtotal=Decimal("508474.58"), tax_rate=Decimal("18.00"), tax_amount=Decimal("91525.42"), total_amount=Decimal("600000.00"), currency="INR", status="draft")
                db.add_all([inv1, inv2, inv3, inv4, inv5, inv6])
                db.flush()

                # Invoice Items
                db.add(InvoiceItem(id=str(uuid.uuid4()), invoice_id=inv1.id, milestone_id=m1.id, description="Project Nexus - Phase 1 Delivery", quantity=Decimal("1.00"), unit_price=Decimal("2118644.07"), total=Decimal("2118644.07")))
                db.add(InvoiceItem(id=str(uuid.uuid4()), invoice_id=inv3.id, description="FinServe CI/CD Pipeline Final Milestone", quantity=Decimal("1.00"), unit_price=Decimal("5169491.53"), total=Decimal("5169491.53")))

                # Payments
                db.add(Payment(id=str(uuid.uuid4()), invoice_id=inv3.id, payment_date=date(2026, 9, 5), amount=Decimal("6100000.00"), payment_method="wire_transfer", transaction_reference="HDFC-N9481230491", status="completed"))
                db.add(Payment(id=str(uuid.uuid4()), invoice_id=inv4.id, payment_date=date(2026, 8, 28), amount=Decimal("1400000.00"), payment_method="upi", transaction_reference="UPI-20260828001", status="completed"))
                db.add(Payment(id=str(uuid.uuid4()), invoice_id=inv5.id, payment_date=date(2026, 8, 12), amount=Decimal("750000.00"), payment_method="wire_transfer", transaction_reference="ICICI-W489201940", status="completed"))

                # Expenses
                db.add(Expense(id=str(uuid.uuid4()), project_id=p2.id, user_id=u_karan.id, expense_category="cloud_compute", amount=Decimal("185000.00"), currency="INR", status="approved"))
                db.add(Expense(id=str(uuid.uuid4()), project_id=p3.id, user_id=u_vikram.id, expense_category="travel", amount=Decimal("12500.00"), currency="INR", status="submitted"))
                db.add(Expense(id=str(uuid.uuid4()), project_id=p4.id, user_id=u_sneha.id, expense_category="license", amount=Decimal("45000.00"), currency="INR", status="approved"))
                db.add(Expense(id=str(uuid.uuid4()), project_id=p1.id, user_id=u_priya.id, expense_category="misc", amount=Decimal("92000.00"), currency="INR", status="approved"))
                db.flush()

                # Audit logs and Notifications
                db.add(AuditLog(id=str(uuid.uuid4()), user_id=admin_user.id, action="SEED_DATABASE", entity_name="SYSTEM", entity_id="INIT", ip_address="127.0.0.1", user_agent="init_db.py"))
                db.add(Notification(id=str(uuid.uuid4()), user_id=admin_user.id, title="System Initialized", message="Welcome to Kapate OS. All enterprise modules and initial records are ready.", notification_type="success"))
                db.flush()


        db.commit()
        logger.info("Database initialization and seed completed successfully.")

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to initialize database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
