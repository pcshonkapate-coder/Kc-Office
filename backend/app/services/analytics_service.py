from typing import List, Dict, Any
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.delivery import Project, ResourceAllocation, Task
from app.models.workforce import Timesheet
from app.models.finance import Invoice, Payment, Expense
from app.schemas.analytics import ProjectProfitabilityDashboard, CostBreakdown
from app.services.currency_service import CurrencyService
from app.core.exceptions import KapateAppException

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.currency_service = CurrencyService()
        self.base_currency = "INR"

    def _normalize_currency(self, amount: float, from_currency: str) -> float:
        if not amount:
            return 0.0
        return self.currency_service.convert(float(amount), from_currency, self.base_currency)

    def get_project_profitability(self, project_id: str) -> ProjectProfitabilityDashboard:
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise KapateAppException(status_code=404, detail="Project not found")

        # 1. Revenue
        invoices = self.db.query(Invoice).filter(
            Invoice.project_id == project_id, 
            Invoice.status != "CANCELLED"
        ).all()
        
        recognized_revenue = sum(
            self._normalize_currency(i.total_amount, i.currency) for i in invoices
        )
        
        realized_revenue = 0.0
        for inv in invoices:
            payments = self.db.query(Payment).filter(
                Payment.invoice_id == inv.id, 
                Payment.status == "completed"
            ).all()
            realized_revenue += sum(
                self._normalize_currency(p.amount, p.currency) for p in payments
            )

        # 2. Expenses (Direct Costs)
        expenses = self.db.query(Expense).filter(
            Expense.project_id == project_id,
            Expense.status == "approved"  # or reimbursed
        ).all()
        
        cb = CostBreakdown()
        for e in expenses:
            norm_amt = self._normalize_currency(e.amount, e.currency)
            cat = e.expense_category.lower()
            if cat == "cloud": cb.cloud += norm_amt
            elif cat == "ai_api": cb.ai_api += norm_amt
            elif cat == "gpu": cb.gpu += norm_amt
            elif cat == "software": cb.software += norm_amt
            elif cat == "contractor": cb.contractor += norm_amt
            elif cat == "travel": cb.travel += norm_amt
            else: cb.other += norm_amt

        # 3. Human Capital (Timesheets * Internal Cost Rate)
        timesheets = self.db.query(Timesheet).filter(
            Timesheet.project_id == project_id,
            Timesheet.status == "APPROVED"
        ).all()
        
        total_logged_hours = 0.0
        for ts in timesheets:
            total_logged_hours += float(ts.hours_spent)
            # Find allocation
            alloc = self.db.query(ResourceAllocation).filter(
                ResourceAllocation.project_id == project_id,
                ResourceAllocation.user_id == ts.user_id
            ).order_by(ResourceAllocation.created_at.desc()).first()
            
            if alloc:
                cost = float(ts.hours_spent) * float(alloc.internal_cost_rate)
                norm_cost = self._normalize_currency(cost, alloc.currency)
                cb.human_capital += norm_cost

        total_actual_cost = sum([
            cb.human_capital, cb.cloud, cb.ai_api, cb.gpu, 
            cb.software, cb.contractor, cb.travel, cb.other
        ])

        # 4. Metrics
        gross_profit = recognized_revenue - total_actual_cost
        gross_margin_percentage = 0.0
        if recognized_revenue > 0:
            gross_margin_percentage = (gross_profit / recognized_revenue) * 100.0

        budget = self._normalize_currency(project.budget, project.currency)
        budget_variance = budget - total_actual_cost

        # Simple forecasting
        total_estimated_hours = self.db.query(func.sum(Task.estimated_hours)).filter(Task.project_id == project_id).scalar() or 0.0
        total_estimated_hours = float(total_estimated_hours)
        
        estimated_final_cost = total_actual_cost
        if total_logged_hours > 0 and total_estimated_hours > total_logged_hours:
            cost_per_hour = total_actual_cost / total_logged_hours
            estimated_final_cost = cost_per_hour * total_estimated_hours
            
        estimated_final_profit = recognized_revenue - estimated_final_cost

        # 5. Warnings Engine
        warnings = []
        if total_actual_cost > budget and budget > 0:
            warnings.append("WARNING: Total actual cost has exceeded the project budget.")
        if total_logged_hours > total_estimated_hours and total_estimated_hours > 0:
            warnings.append("WARNING: Team has logged more hours than initially estimated.")
        if recognized_revenue > 0 and gross_margin_percentage < 20.0:
            warnings.append("CRITICAL: Projected gross margin is below 20%.")
        if (cb.cloud + cb.ai_api + cb.gpu) > (budget * 0.3):
            warnings.append("NOTICE: Infrastructure & AI costs exceed 30% of total budget.")

        return ProjectProfitabilityDashboard(
            project_id=project_id,
            currency=self.base_currency,
            recognized_revenue=round(recognized_revenue, 2),
            realized_revenue=round(realized_revenue, 2),
            total_actual_cost=round(total_actual_cost, 2),
            cost_breakdown=cb,
            gross_profit=round(gross_profit, 2),
            gross_margin_percentage=round(gross_margin_percentage, 2),
            budget=round(budget, 2),
            budget_variance=round(budget_variance, 2),
            estimated_final_cost=round(estimated_final_cost, 2),
            estimated_final_profit=round(estimated_final_profit, 2),
            total_estimated_hours=round(total_estimated_hours, 2),
            total_logged_hours=round(total_logged_hours, 2),
            warnings=warnings
        )
