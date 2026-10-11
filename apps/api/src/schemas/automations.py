from datetime import datetime
from typing import Any, Dict, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class AutomationRuleCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    trigger_event: str = Field(..., examples=["INVOICE_OVERDUE", "TASK_COMPLETED", "EXPENSE_SUBMITTED", "LEAVE_REQUESTED"])
    condition_json: Dict[str, Any] = Field(default_factory=dict)
    action_type: str = Field(..., examples=["SEND_NOTIFICATION", "ADVANCE_MILESTONE", "DISPATCH_WEBHOOK"])
    action_payload_json: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class AutomationRuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    trigger_event: str
    condition_json: Dict[str, Any]
    action_type: str
    action_payload_json: Dict[str, Any]
    is_active: bool
    created_at: datetime


class AutomationLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    rule_id: uuid.UUID
    trigger_event: str
    status: str
    execution_details: Dict[str, Any]
    created_at: datetime
