from typing import List, Optional, Dict
from pydantic import BaseModel

# --- CEO Dashboard ---
class CEODashboardResponse(BaseModel):
    total_revenue: float
    pipeline_value: float
    open_deals_count: int
    new_leads_count: int
    conversion_rate: float
    active_projects_count: int
    project_completion_avg: float
    outstanding_invoices_total: float
    profitability_margin: float
    team_utilization_avg: float

# --- Sales Analytics ---
class SalespersonMetric(BaseModel):
    user_id: str
    name: str
    deals_closed: int
    revenue_generated: float
    win_rate: float

class SalesAnalyticsResponse(BaseModel):
    lead_sources: Dict[str, int]
    lead_conversion_rate: float
    pipeline_value: float
    won_revenue: float
    lost_revenue: float
    average_deal_size: float
    average_sales_cycle_days: float
    salesperson_performance: List[SalespersonMetric]

# --- Project Analytics ---
class ProjectAnalyticsResponse(BaseModel):
    projects_by_status: Dict[str, int]
    on_time_projects: int
    overdue_projects: int
    milestone_completion_avg: float
    total_logged_hours: float
    budget_variance: float
    overall_profitability: float

# --- Team Analytics ---
class TeamAnalyticsResponse(BaseModel):
    overall_utilization: float
    assigned_work_count: int
    completed_tasks_count: int
    total_timesheet_hours: float
    project_allocation_spread: Dict[str, int] # e.g. {"Project A": 40, "Project B": 60}

# --- Finance Analytics ---
class FinanceAnalyticsResponse(BaseModel):
    total_revenue: float
    total_receivables: float
    paid_invoices_total: float
    outstanding_invoices_total: float
    total_expenses: float
    overall_project_margin: float
