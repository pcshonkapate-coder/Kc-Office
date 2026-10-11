import logging
from typing import Any, Dict
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.automations import AutomationLog, AutomationRule
from src.models.communication import Notification
from src.models.projects import Milestone

logger = logging.getLogger("kapate.automation")


class AutomationEngine:
    """Enterprise rule-based automation engine (Trigger -> Condition -> Action)."""

    async def dispatch_event(
        self,
        organization_id: uuid.UUID,
        trigger_event: str,
        event_payload: Dict[str, Any],
        db: AsyncSession,
    ) -> int:
        """Evaluates all active rules for the trigger event and executes actions."""
        stmt = select(AutomationRule).where(
            AutomationRule.organization_id == organization_id,
            AutomationRule.trigger_event == trigger_event,
            AutomationRule.is_active.is_(True),
        )
        rules = (await db.execute(stmt)).scalars().all()
        executed_count = 0

        for rule in rules:
            # 1. Condition evaluation
            matches = self._evaluate_conditions(rule.condition_json, event_payload)
            if not matches:
                log = AutomationLog(
                    organization_id=organization_id,
                    rule_id=rule.id,
                    trigger_event=trigger_event,
                    status="SKIPPED",
                    execution_details={"reason": "Condition criteria not met", "payload": event_payload},
                )
                db.add(log)
                continue

            # 2. Action execution
            try:
                action_result = await self._execute_action(
                    organization_id=organization_id,
                    action_type=rule.action_type,
                    payload=rule.action_payload_json,
                    event_data=event_payload,
                    db=db,
                )
                log = AutomationLog(
                    organization_id=organization_id,
                    rule_id=rule.id,
                    trigger_event=trigger_event,
                    status="SUCCESS",
                    execution_details={"action": rule.action_type, "result": action_result},
                )
                db.add(log)
                executed_count += 1
            except Exception as e:
                logger.error(f"Automation execution failed for rule {rule.id}: {e}")
                log = AutomationLog(
                    organization_id=organization_id,
                    rule_id=rule.id,
                    trigger_event=trigger_event,
                    status="FAILED",
                    execution_details={"error": str(e)},
                )
                db.add(log)

        await db.commit()
        return executed_count

    def _evaluate_conditions(self, conditions: Dict[str, Any], data: Dict[str, Any]) -> bool:
        if not conditions:
            return True
        for key, expected_val in conditions.items():
            if str(data.get(key)) != str(expected_val):
                return False
        return True

    async def _execute_action(
        self,
        organization_id: uuid.UUID,
        action_type: str,
        payload: Dict[str, Any],
        event_data: Dict[str, Any],
        db: AsyncSession,
    ) -> Dict[str, Any]:
        if action_type == "SEND_NOTIFICATION":
            recipient_id_str = payload.get("recipient_id") or event_data.get("user_id")
            if recipient_id_str:
                recipient_uuid = uuid.UUID(recipient_id_str)
                notif = Notification(
                    organization_id=organization_id,
                    recipient_id=recipient_uuid,
                    title=payload.get("title", "Automated System Alert"),
                    message=payload.get("message", "Trigger event completed successfully."),
                    link=payload.get("link"),
                    notification_type="SYSTEM",
                )
                db.add(notif)
                return {"notification_sent": True, "recipient_id": str(recipient_uuid)}

        elif action_type == "ADVANCE_MILESTONE":
            milestone_id_str = payload.get("milestone_id") or event_data.get("milestone_id")
            if milestone_id_str:
                m_stmt = select(Milestone).where(Milestone.id == uuid.UUID(milestone_id_str))
                m = (await db.execute(m_stmt)).scalar_one_or_none()
                if m:
                    m.status = "REACHED"
                    return {"milestone_updated": str(m.id), "new_status": "REACHED"}

        return {"dispatched": True, "action": action_type}


automation_engine = AutomationEngine()
