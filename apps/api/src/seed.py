import asyncio
import uuid
from sqlalchemy import select
from src.core.database import async_session_factory, Base, engine
from src.core.security import hash_password
from src.models.identity import Organization, Permission, Role, RolePermission, User, UserRole

DEFAULT_PERMISSIONS = [
    # Organization
    ("organization.read", "organization", "View Organization Profile"),
    ("organization.update", "organization", "Update Organization Details"),
    ("organization.delete", "organization", "Delete Organization"),
    ("audit.read", "audit", "View Audit Trails"),
    ("system.config.manage", "system", "Manage System Configurations"),
    # Users & Roles
    ("user.create", "identity", "Create Users"),
    ("user.read", "identity", "Read User Profiles"),
    ("user.update", "identity", "Update User Accounts"),
    ("user.delete", "identity", "Deactivate/Delete Users"),
    ("role.create", "identity", "Create Roles"),
    ("role.read", "identity", "Read Roles"),
    ("role.update", "identity", "Update Roles"),
    ("role.delete", "identity", "Delete Roles"),
    ("permission.read", "identity", "Read Available Permissions"),
    ("permission.assign", "identity", "Assign Permissions to Roles"),
    # CRM
    ("crm.account.create", "crm", "Create Client Accounts"),
    ("crm.account.read", "crm", "Read Client Accounts"),
    ("crm.account.update", "crm", "Update Client Accounts"),
    ("crm.account.delete", "crm", "Delete Client Accounts"),
    ("crm.lead.create", "crm", "Create Leads"),
    ("crm.lead.read", "crm", "Read Leads"),
    ("crm.lead.update", "crm", "Update Leads"),
    ("crm.lead.delete", "crm", "Delete Leads"),
    ("crm.deal.create", "crm", "Create Deals"),
    ("crm.deal.read", "crm", "Read Deals"),
    ("crm.deal.update", "crm", "Update Deals"),
    ("crm.deal.delete", "crm", "Delete Deals"),
    ("crm.proposal.generate", "crm", "Generate Client Proposals"),
    ("crm.proposal.approve", "crm", "Approve Client Proposals"),
    ("crm.contract.sign", "crm", "Execute Digital Contracts"),
    # Projects
    ("project.create", "projects", "Create Projects"),
    ("project.read", "projects", "Read Projects"),
    ("project.update", "projects", "Update Projects"),
    ("project.delete", "projects", "Delete Projects"),
    ("project.milestone.manage", "projects", "Manage Milestones"),
    ("project.sprint.manage", "projects", "Manage Sprints"),
    ("task.create", "projects", "Create Tasks"),
    ("task.read", "projects", "Read Tasks"),
    ("task.update", "projects", "Update Tasks"),
    ("task.delete", "projects", "Delete Tasks"),
    ("task.assign", "projects", "Assign Tasks"),
    # Workforce
    ("hr.employee.create", "workforce", "Onboard Employees"),
    ("hr.employee.read", "workforce", "View Employee Profiles"),
    ("hr.employee.update", "workforce", "Update Employee Records"),
    ("hr.employee.delete", "workforce", "Offboard Employees"),
    ("hr.timesheet.log", "workforce", "Log Project Hours"),
    ("hr.timesheet.approve", "workforce", "Approve Timesheets"),
    ("hr.attendance.manage", "workforce", "Manage Attendance"),
    ("hr.intern.evaluate", "workforce", "Evaluate Intern Competencies"),
    ("hr.certificate.issue", "workforce", "Issue Completion Certificates"),
    # Finance
    ("finance.invoice.create", "finance", "Create Invoices"),
    ("finance.invoice.read", "finance", "Read Invoices"),
    ("finance.invoice.update", "finance", "Update Invoices"),
    ("finance.invoice.approve", "finance", "Approve and Send Invoices"),
    ("finance.payment.record", "finance", "Record Received Payments"),
    ("finance.margin.view", "finance", "View Profit Margins and Cost Rates"),
    ("finance.payroll.view", "finance", "View Payroll"),
    # Documents
    ("document.upload", "documents", "Upload Documents to Secure Vault"),
    ("document.read", "documents", "Read Documents"),
    ("document.delete", "documents", "Delete Documents"),
]

SYSTEM_ROLES = [
    ("super_admin", "Super Administrator", "Full uninhibited root control across the platform"),
    ("org_admin", "Organization Admin", "Full tenant-level administrative privileges"),
    ("project_manager", "Project Manager", "Project delivery, sprint planning, and workforce oversight"),
    ("staff_engineer", "Staff Engineer", "Technical task execution and timesheet logging"),
    ("intern", "Intern", "Mentorship hub, assigned learning tasks, and competency evaluations"),
    ("finance_officer", "Finance Officer", "Invoicing, accounts receivable, and margin audits"),
    ("client_user", "Client Stakeholder", "Isolated client portal for milestone tracking and invoice review"),
]


async def seed_database():
    print("Beginning Kapate OS 3.0 initial database seeding...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # 1. Seed Permissions
        perm_map = {}
        for code, module, name in DEFAULT_PERMISSIONS:
            stmt = select(Permission).where(Permission.code == code)
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                p = Permission(code=code, module=module, name=name)
                session.add(p)
                await session.flush()
                perm_map[code] = p
            else:
                perm_map[code] = existing

        # 2. Seed System Roles
        role_map = {}
        for slug, name, desc in SYSTEM_ROLES:
            stmt = select(Role).where(Role.slug == slug, Role.is_system.is_(True))
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                r = Role(slug=slug, name=name, description=desc, is_system=True)
                session.add(r)
                await session.flush()
                role_map[slug] = r
            else:
                role_map[slug] = existing

        # Assign all permissions to org_admin
        org_admin_role = role_map["org_admin"]
        for p in perm_map.values():
            stmt = select(RolePermission).where(
                RolePermission.role_id == org_admin_role.id,
                RolePermission.permission_id == p.id,
            )
            if not (await session.execute(stmt)).scalar_one_or_none():
                session.add(RolePermission(role_id=org_admin_role.id, permission_id=p.id))

        # 3. Seed Default Organization
        org_stmt = select(Organization).where(Organization.slug == "kapate-consultancy")
        org = (await session.execute(org_stmt)).scalar_one_or_none()
        if not org:
            org = Organization(
                slug="kapate-consultancy",
                name="Kapate Consultancy",
                legal_name="Kapate Consultancy Pvt. Ltd.",
                tax_id="GSTIN27AABCK1234F1Z5",
                is_active=True,
                settings={"timezone": "Asia/Kolkata", "currency": "INR"},
            )
            session.add(org)
            await session.flush()

        # 4. Seed Super Admin User
        user_stmt = select(User).where(
            User.organization_id == org.id,
            User.email == "admin@kapateconsultancy.com",
        )
        user = (await session.execute(user_stmt)).scalar_one_or_none()
        if not user:
            user = User(
                organization_id=org.id,
                email="admin@kapateconsultancy.com",
                hashed_password=hash_password("Admin@Kapate2026!"),
                full_name="Shon Kapate",
                phone="+919876543210",
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            await session.flush()

            # Assign Super Admin Role
            super_admin_role = role_map["super_admin"]
            session.add(UserRole(user_id=user.id, role_id=super_admin_role.id))

        await session.commit()
        print("Database seed completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_database())
