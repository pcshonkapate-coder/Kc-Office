from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


# --- Lead Qualification ---

class LeadQualificationRequest(BaseModel):
    company_name: str
    industry: str
    requirement: str
    budget: str
    service_interest: str

class LeadQualificationResponse(BaseModel):
    summary: str
    potential_project_type: str
    complexity: str # LOW, MEDIUM, HIGH
    priority_recommendation: str # LOW, MEDIUM, HIGH
    lead_score: int # 1-100
    suggested_next_action: str


# --- Meeting Summary ---

class MeetingSummaryRequest(BaseModel):
    transcript_text: str

class MeetingSummaryResponse(BaseModel):
    summary: str
    requirements: List[str]
    action_items: List[str]
    risks: List[str]
    questions: List[str]
    next_steps: List[str]


# --- Proposal Draft ---

class ProposalDraftRequest(BaseModel):
    client_requirement: str
    discovery_notes: str
    project_information: str

class ProposalDraftResponse(BaseModel):
    executive_summary: str
    scope: str
    deliverables: List[str]
    timeline_estimate: str
    technology_recommendations: List[str]
    assumptions: List[str]
    exclusions: List[str]


# --- Task Breakdown ---

class TaskBreakdownRequest(BaseModel):
    project_requirement: str

class TaskBreakdownResponse(BaseModel):
    suggested_tasks: List[str]


# --- Project Risk Analysis ---

class ProjectRiskAnalysisRequest(BaseModel):
    overdue_tasks_count: int
    budget_variance: float
    hours_variance: float
    upcoming_milestones: int

class ProjectRiskAnalysisResponse(BaseModel):
    potential_risks: List[str]
    severity: str # LOW, MEDIUM, HIGH, CRITICAL
    recommended_actions: List[str]


# --- Cost Insights ---

class CostInsightsRequest(BaseModel):
    expense_data_json: str

class CostInsightsResponse(BaseModel):
    explanations: List[str]


# --- Draft Response (for HTTP API wrapper) ---

class AIDraftResponse(BaseModel):
    id: str
    feature: str
    draft_content: Dict[str, Any]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
