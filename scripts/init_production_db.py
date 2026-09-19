"""
Kapate OS - Production Database Initializer
Creates clean relational tables, RBAC roles, permissions, departments, services,
and the default Super Admin user without any test/mock operational records.
"""
import sys
import os
import uuid
import logging
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models import (
    User, Role, Permission, RolePermission, UserRole, Department, Employee, Intern, Freelancer,
    Attendance, LeaveRequest, Timesheet, Service, Company, Contact, Lead, Deal,
    DealStageHistory, DealContact, Activity, Project, Milestone, Task, Subtask,
    DeliveryComment, ResourceAllocation, Invoice, InvoiceItem, Payment, Expense,
    Document, Notification, AuditLog, ActivityEvent
)
from app.models.document import ManagedDocument, DocumentVersion, SignatureTracker
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("init_production_db")

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
    ("delivery:projects:read", "delivery", "View delivery projects and milestones"),
    ("delivery:projects:write", "delivery", "Create and manage projects"),
    ("delivery:tasks:read", "delivery", "View sprint and Kanban tasks"),
    ("delivery:tasks:write", "delivery", "Create, assign, and update tasks"),
    ("delivery:milestones:approve", "delivery", "Approve milestone sign-offs"),
    ("workforce:directory:read", "workforce", "View internal staff directory"),
    ("workforce:profiles:write", "workforce", "Manage employee and contractor profiles"),
    ("workforce:interns:eval", "workforce", "Submit intern evaluation scores"),
    ("timesheet:self:write", "workforce", "Log and submit personal timesheets"),
    ("timesheet:team:approve", "workforce", "Approve employee and intern timesheets"),
    ("finance:invoices:read", "finance", "View client invoices and payment status"),
    ("finance:invoices:write", "finance", "Create, issue, and void client invoices"),
    ("finance:expenses:write", "finance", "Submit and record operating expenses"),
    ("finance:margins:audit", "finance", "View profit margins and labor costs"),
    ("client:portal:access", "client", "Access authorized client deliverables portal"),
    ("system:config:write", "system", "Configure enterprise system settings and users"),
    ("audit:logs:read", "system", "Inspect immutable security audit logs")
]

DEPARTMENTS = [
    ("Executive Leadership", "EXEC"),
    ("AI & Machine Learning", "AI_ML"),
    ("Custom Software Engineering", "SWE"),
    ("Cloud & IT Infrastructure", "CLOUD"),
    ("Finance & Legal Operations", "FIN_LEGAL"),
    ("Sales & Enterprise Partnerships", "SALES_BIZ"),
]

SERVICES = [
    ("AI Solutions", "AI_SOLUTIONS", "Custom AI agents, LLM integrations, and enterprise automation.", "AI Practice"),
    ("ML & Data Analytics", "ML_DATA", "Machine learning modeling, data pipelines, and predictive analytics.", "Data Science"),
    ("Custom Software Development", "CUSTOM_SOFTWARE", "Enterprise web, mobile, and cloud software engineering.", "Engineering"),
    ("IT Solutions & Cloud", "IT_SOLUTIONS", "Cloud migration, DevOps, security, and IT infrastructure advisory.", "IT Advisory"),
]

def init_production_database():
    logger.info("Dropping and recreating clean relational database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    logger.info("All normalized relational tables created.")

    db = SessionLocal()
    try:
        # 1. Seed Roles
        role_map = {}
        for name, desc, is_sys in STANDARD_ROLES:
            role = Role(name=name, description=desc, is_system=is_sys)
            db.add(role)
            db.flush()
            role_map[name] = role
        logger.info(f"Seeded {len(role_map)} standard RBAC roles.")

        # 2. Seed Permissions
        perm_map = {}
        for code, module, desc in STANDARD_PERMISSIONS:
            perm = Permission(code=code, module=module.upper(), description=desc)
            db.add(perm)
            db.flush()
            perm_map[code] = perm
        logger.info(f"Seeded {len(perm_map)} standard permissions.")

        # 3. Associate Permissions to Roles
        role_perm_matrix = {
            "superadmin": list(perm_map.keys()),
            "partner": [p for p in perm_map.keys() if not p.startswith("system:")],
            "consultant": ["crm:leads:read", "crm:leads:write", "crm:deals:read", "crm:deals:write", "crm:companies:read", "delivery:projects:read", "delivery:projects:write", "delivery:tasks:read", "delivery:tasks:write", "workforce:directory:read", "workforce:interns:eval", "timesheet:self:write", "timesheet:team:approve", "finance:invoices:read"],
            "engineer": ["crm:leads:read", "delivery:projects:read", "delivery:tasks:read", "delivery:tasks:write", "workforce:directory:read", "timesheet:self:write"],
            "intern": ["delivery:tasks:read", "delivery:tasks:write", "timesheet:self:write"],
            "freelancer": ["delivery:tasks:read", "delivery:tasks:write", "timesheet:self:write"],
            "client": ["client:portal:access", "finance:invoices:read"]
        }

        for rname, perms in role_perm_matrix.items():
            r = role_map[rname]
            for pcode in perms:
                if pcode in perm_map:
                    db.add(RolePermission(role_id=r.id, permission_id=perm_map[pcode].id))
        db.flush()
        logger.info("Associated RBAC permission matrix to roles.")

        # 4. Seed Departments
        dept_map = {}
        for name, code in DEPARTMENTS:
            dept = Department(name=name, code=code, is_active=True)
            db.add(dept)
            db.flush()
            dept_map[name] = dept
        logger.info(f"Seeded {len(dept_map)} core departments.")

        # 5. Seed Core Services
        svc_map = {}
        for name, code, desc, cat in SERVICES:
            svc = Service(name=name, code=code, description=desc, category=cat, is_active=True)
            db.add(svc)
            db.flush()
            svc_map[code] = svc
        logger.info(f"Seeded {len(svc_map)} core services.")

        # 6. Seed Super Admin User (Production Ready)
        admin_email = "admin@kapateconsultancy.in"
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash("Admin@KC8421174957"),
            full_name="Shon Kapate",
            phone="+91 98230 00000",
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)
        db.flush()

        db.add(UserRole(user_id=admin_user.id, role_id=role_map["superadmin"].id))
        db.add(AuditLog(
            id=str(uuid.uuid4()),
            user_id=admin_user.id,
            action="INITIALIZE_PRODUCTION_DATABASE",
            entity_name="SYSTEM",
            entity_id="PROD_INIT",
            ip_address="127.0.0.1",
            user_agent="init_production_db.py"
        ))

        db.commit()
        logger.info("Production database initialization completed successfully.")
        logger.info(f"Default Super Admin: {admin_email} | Password: KapateAdmin@2026!")

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to initialize production database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_production_database()
