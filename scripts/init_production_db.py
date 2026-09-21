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

def init_production_database(force_drop: bool = False):
    if force_drop:
        env = os.environ.get("ENVIRONMENT", "development").lower()
        if env == "production":
            logger.error("FATAL: Cannot drop tables in PRODUCTION environment.")
            sys.exit(1)
        logger.warning("FORCED: Dropping and recreating tables (NON-PRODUCTION ONLY)...")
        Base.metadata.drop_all(bind=engine)
    
    logger.info("Ensuring all normalized relational tables are created (non-destructive)...")
    Base.metadata.create_all(bind=engine)
    logger.info("Relational tables verified.")

    db = SessionLocal()
    try:
        # 1. Seed / Upsert Roles (Idempotent)
        role_map = {}
        for name, desc, is_sys in STANDARD_ROLES:
            existing_role = db.query(Role).filter(Role.name == name).first()
            if not existing_role:
                role = Role(name=name, description=desc, is_system=is_sys)
                db.add(role)
                db.flush()
                role_map[name] = role
            else:
                role_map[name] = existing_role
        logger.info(f"Verified {len(role_map)} standard RBAC roles.")

        # 2. Seed / Upsert Permissions (Idempotent)
        perm_map = {}
        for code, module, desc in STANDARD_PERMISSIONS:
            existing_perm = db.query(Permission).filter(Permission.code == code).first()
            if not existing_perm:
                perm = Permission(code=code, module=module.upper(), description=desc)
                db.add(perm)
                db.flush()
                perm_map[code] = perm
            else:
                perm_map[code] = existing_perm
        logger.info(f"Verified {len(perm_map)} standard permissions.")

        # 3. Associate Permissions to Roles (Idempotent)
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
            r = role_map.get(rname)
            if not r:
                continue
            for pcode in perms:
                if pcode in perm_map:
                    p = perm_map[pcode]
                    exists = db.query(RolePermission).filter(
                        RolePermission.role_id == r.id,
                        RolePermission.permission_id == p.id
                    ).first()
                    if not exists:
                        db.add(RolePermission(role_id=r.id, permission_id=p.id))
        db.flush()
        logger.info("Verified RBAC permission matrix mapping.")

        # 4. Seed / Upsert Departments (Idempotent)
        dept_map = {}
        for name, code in DEPARTMENTS:
            existing_dept = db.query(Department).filter((Department.name == name) | (Department.code == code)).first()
            if not existing_dept:
                dept = Department(name=name, code=code, is_active=True)
                db.add(dept)
                db.flush()
                dept_map[name] = dept
            else:
                dept_map[name] = existing_dept
        logger.info(f"Verified {len(dept_map)} core departments.")

        # 5. Seed / Upsert Core Services (Idempotent)
        svc_map = {}
        for name, code, desc, cat in SERVICES:
            existing_svc = db.query(Service).filter((Service.name == name) | (Service.code == code)).first()
            if not existing_svc:
                svc = Service(name=name, code=code, description=desc, category=cat, is_active=True)
                db.add(svc)
                db.flush()
                svc_map[code] = svc
            else:
                svc_map[code] = existing_svc
        logger.info(f"Verified {len(svc_map)} core services.")

        # 6. Seed / Verify Super Admin Users (Idempotent, Zero Data Loss)
        admin_configs = [
            ("admin@kapateconsultancy.in", "Admin@KC8421174957", "Shon Kapate", "+91 98230 00000"),
            ("admin@kapateconsultancy.com", "KapateOS@2026!", "Kapate Admin", "+91 98230 00001")
        ]
        superadmin_role = role_map.get("superadmin")

        for email, pwd, name, phone in admin_configs:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    full_name=name,
                    phone=phone,
                    is_active=True,
                    is_verified=True
                )
                db.add(user)
                db.flush()
                if superadmin_role:
                    db.add(UserRole(user_id=user.id, role_id=superadmin_role.id))
                logger.info(f"Provisioned Super Admin account: {email}")
            else:
                user.hashed_password = get_password_hash(pwd)
                user.is_active = True
                user.is_verified = True
                if superadmin_role:
                    existing_ur = db.query(UserRole).filter(
                        UserRole.user_id == user.id,
                        UserRole.role_id == superadmin_role.id
                    ).first()
                    if not existing_ur:
                        db.add(UserRole(user_id=user.id, role_id=superadmin_role.id))
                logger.info(f"Verified & synchronized Super Admin account: {email}")

        db.commit()
        logger.info("Production database initialization/verification completed successfully.")
        logger.info(f"Primary Super Admin Email: {admin_configs[0][0]}")

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to initialize production database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_production_database()
