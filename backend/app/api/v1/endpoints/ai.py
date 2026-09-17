from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User

from app.schemas.ai import (
    LeadQualificationRequest, LeadQualificationResponse,
    MeetingSummaryRequest, MeetingSummaryResponse,
    ProposalDraftRequest, ProposalDraftResponse,
    TaskBreakdownRequest, TaskBreakdownResponse,
    ProjectRiskAnalysisRequest, ProjectRiskAnalysisResponse,
    CostInsightsRequest, CostInsightsResponse
)
from app.services.ai.ai_service import AIService
from app.services.ai.prompts import (
    LEAD_QUALIFICATION_PROMPT, MEETING_SUMMARY_PROMPT, 
    PROPOSAL_DRAFT_PROMPT, TASK_BREAKDOWN_PROMPT, 
    RISK_ANALYSIS_PROMPT, COST_INSIGHTS_PROMPT
)

router = APIRouter()

def get_ai_service(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return AIService(db, current_user)


@router.post("/qualify-lead", response_model=LeadQualificationResponse)
def qualify_lead(
    data: LeadQualificationRequest,
    service: AIService = Depends(get_ai_service)
):
    """Analyze a new lead and provide a structured qualification score."""
    prompt = LEAD_QUALIFICATION_PROMPT.format(
        company_name=data.company_name,
        industry=data.industry,
        requirement=data.requirement,
        budget=data.budget,
        service_interest=data.service_interest
    )
    
    # Lead qualification doesn't necessarily need a draft, just returns JSON
    return service.execute_ai_pipeline(
        feature_name="lead_qualification",
        prompt=prompt,
        response_schema=LeadQualificationResponse
    )

@router.post("/summarize-meeting", response_model=MeetingSummaryResponse)
def summarize_meeting(
    data: MeetingSummaryRequest,
    service: AIService = Depends(get_ai_service)
):
    """Summarizes meeting transcripts and creates an AIDraft for human review."""
    prompt = MEETING_SUMMARY_PROMPT.format(transcript_text=data.transcript_text)
    
    return service.execute_ai_pipeline(
        feature_name="meeting_summary",
        prompt=prompt,
        response_schema=MeetingSummaryResponse,
        save_as_draft=True
    )

@router.post("/draft-proposal", response_model=ProposalDraftResponse)
def draft_proposal(
    data: ProposalDraftRequest,
    service: AIService = Depends(get_ai_service)
):
    """Generates a structured proposal draft for human review."""
    prompt = PROPOSAL_DRAFT_PROMPT.format(
        client_requirement=data.client_requirement,
        discovery_notes=data.discovery_notes,
        project_information=data.project_information
    )
    
    return service.execute_ai_pipeline(
        feature_name="proposal_draft",
        prompt=prompt,
        response_schema=ProposalDraftResponse,
        save_as_draft=True
    )

@router.post("/breakdown-tasks", response_model=TaskBreakdownResponse)
def breakdown_tasks(
    data: TaskBreakdownRequest,
    service: AIService = Depends(get_ai_service)
):
    """Breaks down a project requirement into granular tasks. Requires human approval."""
    prompt = TASK_BREAKDOWN_PROMPT.format(project_requirement=data.project_requirement)
    
    return service.execute_ai_pipeline(
        feature_name="task_breakdown",
        prompt=prompt,
        response_schema=TaskBreakdownResponse,
        save_as_draft=True
    )

@router.post("/analyze-project-risk", response_model=ProjectRiskAnalysisResponse)
def analyze_project_risk(
    data: ProjectRiskAnalysisRequest,
    service: AIService = Depends(get_ai_service)
):
    """Analyzes project variances and flags risks."""
    prompt = RISK_ANALYSIS_PROMPT.format(
        overdue_tasks_count=data.overdue_tasks_count,
        budget_variance=data.budget_variance,
        hours_variance=data.hours_variance,
        upcoming_milestones=data.upcoming_milestones
    )
    
    return service.execute_ai_pipeline(
        feature_name="project_risk_analysis",
        prompt=prompt,
        response_schema=ProjectRiskAnalysisResponse
    )

@router.post("/analyze-cost-insights", response_model=CostInsightsResponse)
def analyze_cost_insights(
    data: CostInsightsRequest,
    service: AIService = Depends(get_ai_service)
):
    """Analyzes bulk financial data for anomalies."""
    prompt = COST_INSIGHTS_PROMPT.format(expense_data_json=data.expense_data_json)
    
    return service.execute_ai_pipeline(
        feature_name="cost_insights",
        prompt=prompt,
        response_schema=CostInsightsResponse
    )
