from typing import Any, Dict, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth import (
    AuthenticatedUserContext,
    get_current_user_context,
    require_permissions,
)
from src.core.database import get_db_session
from src.models.automations import AutomationLog, AutomationRule
from src.schemas.automations import (
    AutomationLogRead,
    AutomationRuleCreate,
    AutomationRuleRead,
)
from src.services.automation_engine import automation_engine

router = APIRouter(prefix="/automations", tags=["Rule-Based Automation Engine"])


class TriggerTestRequest(BaseModel):
    trigger_event: str
    payload: Dict[str, Any]


@router.get(
    "/rules",
    response_model=List[AutomationRuleRead],
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def list_automation_rules(
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(AutomationRule)
        .where(AutomationRule.organization_id == context.user.organization_id)
        .order_by(desc(AutomationRule.created_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/rules",
    response_model=AutomationRuleRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def create_automation_rule(
    payload: AutomationRuleCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    rule = AutomationRule(
        organization_id=context.user.organization_id,
        name=payload.name,
        trigger_event=payload.trigger_event,
        condition_json=payload.condition_json,
        action_type=payload.action_type,
        action_payload_json=payload.action_payload_json,
        is_active=payload.is_active,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.get(
    "/logs",
    response_model=List[AutomationLogRead],
    dependencies=[Depends(require_permissions("system.config.manage"))],
)
async def list_automation_logs(
    limit: int = Query(50, ge=1, le=100),
    context: AuthenticatedUserContext = Depends(require_permissions("system.config.manage")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(AutomationLog)
        .where(AutomationLog.organization_id == context.user.organization_id)
        .order_by(desc(AutomationLog.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/test-trigger")
async def trigger_test_event(
    payload: TriggerTestRequest,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    executed = await automation_engine.dispatch_event(
        organization_id=context.user.organization_id,
        trigger_event=payload.trigger_event,
        event_payload=payload.payload,
        db=db,
    )
    return {
        "message": f"Dispatched event {payload.trigger_event}",
        "executed_rules_count": executed,
    }
