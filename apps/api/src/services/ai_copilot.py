from abc import ABC, abstractmethod
import time
from typing import Any, Dict, List, Tuple
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth import AuthenticatedUserContext
from src.models.ai import AIAuditLog
from src.models.crm import Opportunity
from src.models.finance import Invoice
from src.models.projects import Project
from src.models.workforce import Department, Employee
from src.schemas.ai import AIToolCallDetail


class AIProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        context: AuthenticatedUserContext,
        db: AsyncSession,
    ) -> Tuple[str, List[AIToolCallDetail], List[str]]:
        pass


class KapateEnterpriseAIProvider(AIProvider):
    """Production Enterprise AI Copilot with Strict RBAC Tool Execution."""

    async def generate_response(
        self,
        prompt: str,
        context: AuthenticatedUserContext,
        db: AsyncSession,
    ) -> Tuple[str, List[AIToolCallDetail], List[str]]:
        start_time = time.perf_counter()
        prompt_lower = prompt.lower()
        tools_executed: List[AIToolCallDetail] = []
        records_accessed: List[str] = []
        response_lines: List[str] = []

        # 1. Tool 1: Search Projects
        if any(w in prompt_lower for w in ["project", "delivery", "health", "sprint"]):
            perm_required = "project.read"
            has_perm = context.has_permission(perm_required)
            if has_perm:
                p_stmt = (
                    select(Project)
                    .where(
                        Project.organization_id == context.user.organization_id,
                        Project.deleted_at.is_(None),
                    )
                    .limit(5)
                )
                projects = (await db.execute(p_stmt)).scalars().all()
                p_names = [f"• {p.project_code}: {p.name} [{p.health_status}, Budget: ₹{p.total_budget}]" for p in projects]
                for p in projects:
                    records_accessed.append(f"Project:{p.id}")

                tools_executed.append(
                    AIToolCallDetail(
                        tool_name="search_projects",
                        arguments={"query": prompt},
                        rbac_passed=True,
                        records_returned=len(projects),
                    )
                )
                response_lines.append(f"**Enterprise Projects Active Overview:**\n" + "\n".join(p_names))
            else:
                tools_executed.append(
                    AIToolCallDetail(
                        tool_name="search_projects",
                        arguments={"query": prompt},
                        rbac_passed=False,
                        records_returned=0,
                    )
                )
                response_lines.append(f"*(Access Restricted: Lacking '{perm_required}' permission to view projects)*")

        # 2. Tool 2: Invoice & Finance Summary
        if any(w in prompt_lower for w in ["invoice", "revenue", "bill", "finance", "tax", "gst"]):
            perm_required = "finance.invoice.read"
            has_perm = context.has_permission(perm_required)
            if has_perm:
                inv_stmt = (
                    select(Invoice)
                    .where(
                        Invoice.organization_id == context.user.organization_id,
                        Invoice.deleted_at.is_(None),
                    )
                    .limit(5)
                )
                invoices = (await db.execute(inv_stmt)).scalars().all()
                inv_details = [
                    f"• {inv.invoice_number}: ₹{inv.total_amount} (Tax: ₹{inv.total_tax}) - Status: {inv.status}"
                    for inv in invoices
                ]
                for inv in invoices:
                    records_accessed.append(f"Invoice:{inv.id}")

                tools_executed.append(
                    AIToolCallDetail(
                        tool_name="get_invoice_summary",
                        arguments={"query": prompt},
                        rbac_passed=True,
                        records_returned=len(invoices),
                    )
                )
                response_lines.append(f"**Financial Invoices Ledger Snapshot:**\n" + "\n".join(inv_details))
            else:
                tools_executed.append(
                    AIToolCallDetail(
                        tool_name="get_invoice_summary",
                        arguments={"query": prompt},
                        rbac_passed=False,
                        records_returned=0,
                    )
                )
                response_lines.append(f"*(Access Restricted: Lacking '{perm_required}' permission to view invoices)*")

        # 3. Tool 3: Sales Pipeline Status
        if any(w in prompt_lower for w in ["deal", "pipeline", "crm", "lead", "sales"]):
            perm_required = "crm.deal.read"
            has_perm = context.has_permission(perm_required)
            if has_perm:
                deal_stmt = (
                    select(Opportunity)
                    .where(
                        Opportunity.organization_id == context.user.organization_id,
                        Opportunity.deleted_at.is_(None),
                    )
                    .limit(5)
                )
                deals = (await db.execute(deal_stmt)).scalars().all()
                deal_details = [
                    f"• {d.name}: ₹{d.contract_amount} [Stage: {d.stage}, Win Prob: {d.win_probability}%]"
                    for d in deals
                ]
                for d in deals:
                    records_accessed.append(f"Opportunity:{d.id}")

                tools_executed.append(
                    AIToolCallDetail(
                        tool_name="get_pipeline_status",
                        arguments={"query": prompt},
                        rbac_passed=True,
                        records_returned=len(deals),
                    )
                )
                response_lines.append(f"**Sales Opportunities Pipeline:**\n" + "\n".join(deal_details))
            else:
                tools_executed.append(
                    AIToolCallDetail(
                        tool_name="get_pipeline_status",
                        arguments={"query": prompt},
                        rbac_passed=False,
                        records_returned=0,
                    )
                )
                response_lines.append(f"*(Access Restricted: Lacking '{perm_required}' permission to view deals)*")

        # 4. Tool 4: Workforce Capacity & Attendance
        if any(w in prompt_lower for w in ["team", "employee", "capacity", "attendance", "workforce", "people"]):
            perm_required = "workforce.attendance.read"
            has_perm = context.has_permission(perm_required)
            if has_perm:
                emp_stmt = (
                    select(Employee)
                    .where(
                        Employee.organization_id == context.user.organization_id,
                        Employee.deleted_at.is_(None),
                    )
                    .limit(5)
                )
                employees = (await db.execute(emp_stmt)).scalars().all()
                emp_details = [
                    f"• {e.employee_code}: Status {e.employment_status} (Designation: {e.designation})"
                    for e in employees
                ]
                for e in employees:
                    records_accessed.append(f"Employee:{e.id}")

                tools_executed.append(
                    AIToolCallDetail(
                        tool_name="get_workforce_capacity",
                        arguments={"query": prompt},
                        rbac_passed=True,
                        records_returned=len(employees),
                    )
                )
                response_lines.append(f"**Workforce Headcount & Capacity:**\n" + "\n".join(emp_details))
            else:
                tools_executed.append(
                    AIToolCallDetail(
                        tool_name="get_workforce_capacity",
                        arguments={"query": prompt},
                        rbac_passed=False,
                        records_returned=0,
                    )
                )
                response_lines.append(f"*(Access Restricted: Lacking '{perm_required}' permission to view workforce)*")

        # Default synthesised answer
        if not response_lines:
            response_text = (
                f"Hello {context.user.full_name}. I am the KAPATE OS Enterprise AI Copilot. "
                "I have real-time, RBAC-guarded access to Projects, CRM Pipelines, Financial Invoices, "
                "and Workforce records. How may I assist your operations today?"
            )
        else:
            response_text = "Here is the operational intelligence retrieved for your request:\n\n" + "\n\n".join(response_lines)

        latency_ms = int((time.perf_counter() - start_time) * 1000)

        # Immutably record in AI Audit Log
        audit_log = AIAuditLog(
            organization_id=context.user.organization_id,
            user_id=context.user.id,
            prompt=prompt,
            response=response_text,
            model_name="kapate-enterprise-copilot-v3",
            tools_called=[t.model_dump() for t in tools_executed],
            records_accessed=records_accessed,
            tokens_used=len(prompt) + len(response_text),
            latency_ms=latency_ms,
            is_rbac_enforced=True,
        )
        db.add(audit_log)
        await db.commit()

        return response_text, tools_executed, records_accessed


ai_provider = KapateEnterpriseAIProvider()

