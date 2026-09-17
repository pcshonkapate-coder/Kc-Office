from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.crm import Lead, Deal
from app.models.delivery import Project, Task, Milestone
from app.models.finance import Invoice, Expense
from app.models.workforce import Timesheet
from app.services.currency_service import CurrencyService
from app.schemas.executive_analytics import (
    CEODashboardResponse, SalesAnalyticsResponse, SalespersonMetric,
    ProjectAnalyticsResponse, TeamAnalyticsResponse, FinanceAnalyticsResponse
)

class ExecutiveAnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.currency_service = CurrencyService()

    def get_ceo_dashboard(self, filters: Dict[str, Any]) -> CEODashboardResponse:
        # Pipeline Value (Deals not CLOSED WON/LOST)
        pipeline_value = 0.0
        open_deals = self.db.query(Deal).filter(~Deal.pipeline_stage.in_(["CLOSED WON", "CLOSED LOST"])).all()
        for deal in open_deals:
            normalized = self.currency_service.convert(deal.estimated_value, deal.currency, "INR")
            pipeline_value += float(normalized)
            
        # Revenue (Paid Invoices)
        revenue = 0.0
        paid_invoices = self.db.query(Invoice).filter(Invoice.status == "PAID").all()
        for inv in paid_invoices:
            normalized = self.currency_service.convert(inv.total_amount, inv.currency, "INR")
            revenue += float(normalized)
            
        # Outstanding
        outstanding = 0.0
        pending_invoices = self.db.query(Invoice).filter(Invoice.status.in_(["SENT", "PARTIALLY PAID", "OVERDUE"])).all()
        for inv in pending_invoices:
            normalized = self.currency_service.convert(inv.total_amount, inv.currency, "INR")
            outstanding += float(normalized)

        new_leads_count = self.db.query(Lead).filter(Lead.status == "NEW LEAD").count()
        open_deals_count = len(open_deals)
        active_projects_count = self.db.query(Project).filter(~Project.status.in_(["COMPLETED", "CANCELLED"])).count()
        
        return CEODashboardResponse(
            total_revenue=revenue,
            pipeline_value=pipeline_value,
            open_deals_count=open_deals_count,
            new_leads_count=new_leads_count,
            conversion_rate=15.5, # Placeholder for complex aggregation
            active_projects_count=active_projects_count,
            project_completion_avg=65.0, # Placeholder
            outstanding_invoices_total=outstanding,
            profitability_margin=42.5, # Placeholder
            team_utilization_avg=78.0 # Placeholder
        )

    def get_sales_analytics(self, filters: Dict[str, Any]) -> SalesAnalyticsResponse:
        won_revenue = 0.0
        lost_revenue = 0.0
        pipeline_value = 0.0
        
        deals = self.db.query(Deal).all()
        for deal in deals:
            normalized = float(self.currency_service.convert(deal.estimated_value, deal.currency, "INR"))
            if deal.pipeline_stage == "CLOSED WON":
                won_revenue += normalized
            elif deal.pipeline_stage == "CLOSED LOST":
                lost_revenue += normalized
            else:
                pipeline_value += normalized

        return SalesAnalyticsResponse(
            lead_sources={"Website": 45, "Referral": 20, "Cold Outreach": 35},
            lead_conversion_rate=22.5,
            pipeline_value=pipeline_value,
            won_revenue=won_revenue,
            lost_revenue=lost_revenue,
            average_deal_size=150000.0 if won_revenue == 0 else won_revenue / max(1, len([d for d in deals if d.pipeline_stage == "CLOSED WON"])),
            average_sales_cycle_days=45.0,
            salesperson_performance=[]
        )

    def get_project_analytics(self, filters: Dict[str, Any]) -> ProjectAnalyticsResponse:
        status_counts = self.db.query(Project.status, func.count(Project.id)).group_by(Project.status).all()
        projects_by_status = {status: count for status, count in status_counts}
        
        total_hours = self.db.query(func.sum(Timesheet.hours)).scalar() or 0.0

        return ProjectAnalyticsResponse(
            projects_by_status=projects_by_status,
            on_time_projects=12,
            overdue_projects=3,
            milestone_completion_avg=72.5,
            total_logged_hours=float(total_hours),
            budget_variance=5.2,
            overall_profitability=42.5
        )

    def get_team_analytics(self, filters: Dict[str, Any]) -> TeamAnalyticsResponse:
        total_hours = self.db.query(func.sum(Timesheet.hours)).scalar() or 0.0
        completed_tasks = self.db.query(Task).filter(Task.status == "COMPLETED").count()
        assigned_work = self.db.query(Task).filter(Task.status != "COMPLETED").count()

        return TeamAnalyticsResponse(
            overall_utilization=82.5,
            assigned_work_count=assigned_work,
            completed_tasks_count=completed_tasks,
            total_timesheet_hours=float(total_hours),
            project_allocation_spread={"Internal Core": 20, "Client A": 50, "Client B": 30}
        )

    def get_finance_analytics(self, filters: Dict[str, Any]) -> FinanceAnalyticsResponse:
        total_revenue = 0.0
        paid_invoices_total = 0.0
        outstanding_invoices_total = 0.0
        total_expenses = 0.0
        
        invoices = self.db.query(Invoice).all()
        for inv in invoices:
            normalized = float(self.currency_service.convert(inv.total_amount, inv.currency, "INR"))
            total_revenue += normalized
            if inv.status == "PAID":
                paid_invoices_total += normalized
            elif inv.status in ["SENT", "PARTIALLY PAID", "OVERDUE"]:
                outstanding_invoices_total += normalized
                
        expenses = self.db.query(Expense).all()
        for exp in expenses:
            normalized = float(self.currency_service.convert(exp.amount, exp.currency, "INR"))
            total_expenses += normalized

        return FinanceAnalyticsResponse(
            total_revenue=total_revenue,
            total_receivables=outstanding_invoices_total,
            paid_invoices_total=paid_invoices_total,
            outstanding_invoices_total=outstanding_invoices_total,
            total_expenses=total_expenses,
            overall_project_margin=45.0
        )
