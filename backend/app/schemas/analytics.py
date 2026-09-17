from typing import List, Dict
from pydantic import BaseModel

class CostBreakdown(BaseModel):
    human_capital: float = 0.0
    cloud: float = 0.0
    ai_api: float = 0.0
    gpu: float = 0.0
    software: float = 0.0
    contractor: float = 0.0
    travel: float = 0.0
    other: float = 0.0

class ProjectProfitabilityDashboard(BaseModel):
    project_id: str
    currency: str = "INR"
    
    # Revenue
    recognized_revenue: float
    realized_revenue: float
    
    # Costs
    total_actual_cost: float
    cost_breakdown: CostBreakdown
    
    # Metrics
    gross_profit: float
    gross_margin_percentage: float
    
    budget: float
    budget_variance: float
    
    estimated_final_cost: float
    estimated_final_profit: float
    
    # Hours
    total_estimated_hours: float
    total_logged_hours: float
    
    # Warnings
    warnings: List[str] = []
