import time
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth import (
    AuthenticatedUserContext,
    get_current_user_context,
    require_permissions,
)
from src.core.database import get_db_session
from src.models.ai import AIAuditLog
from src.schemas.ai import (
    AIAuditLogRead,
    AIChatRequest,
    AIChatResponse,
)
from src.services.ai_copilot import ai_provider

router = APIRouter(prefix="/ai", tags=["AI Copilot & Intelligence"])


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_copilot(
    payload: AIChatRequest,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    start = time.perf_counter()
    response_text, tools_executed, records_accessed = await ai_provider.generate_response(
        prompt=payload.prompt,
        context=context,
        db=db,
    )
    latency_ms = int((time.perf_counter() - start) * 1000)

    return AIChatResponse(
        response_text=response_text,
        model_name="kapate-enterprise-copilot-v3",
        tools_executed=tools_executed,
        records_accessed=records_accessed,
        latency_ms=latency_ms,
    )


@router.get(
    "/audit",
    response_model=List[AIAuditLogRead],
    dependencies=[Depends(require_permissions("audit.read"))],
)
async def list_ai_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    context: AuthenticatedUserContext = Depends(require_permissions("audit.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(AIAuditLog)
        .where(AIAuditLog.organization_id == context.user.organization_id)
        .order_by(desc(AIAuditLog.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
