from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel


class AttentionRequiredItem(BaseModel):
    severity: str  # "CRITICAL", "WARNING", "INFO"
    title: str
    description: str
    link: str
    entity_type: str
    entity_id: str


class CompanyPulseMetrics(BaseModel):
    active_projects_count: int
    active_billable_hours_week: float
    sprint_velocity_pct: float
    attendance_health_pct: float


class RevenuePipelineMetrics(BaseModel):
    mtd_collected_revenue: Decimal
    ytd_collected_revenue: Decimal
    total_pipeline_value: Decimal
    weighted_pipeline_value: Decimal
    average_gross_margin_pct: Decimal


class HierarchyDrilldownNode(BaseModel):
    id: str
    name: str
    level: str  # "COMPANY", "DEPARTMENT", "TEAM", "PROJECT", "USER"
    budget: Decimal
    revenue_or_cost: Decimal
    efficiency_pct: float
    children: List["HierarchyDrilldownNode"] = []


class CEOCommandCenterResponse(BaseModel):
    attention_required: List[AttentionRequiredItem]
    company_pulse: CompanyPulseMetrics
    revenue_pipeline: RevenuePipelineMetrics
    hierarchy_drilldown: HierarchyDrilldownNode
