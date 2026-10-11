from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class AIChatRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=2000)
    context_entity_type: Optional[str] = None
    context_entity_id: Optional[str] = None


class AIToolCallDetail(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    rbac_passed: bool
    records_returned: int


class AIChatResponse(BaseModel):
    response_text: str
    model_name: str
    tools_executed: List[AIToolCallDetail]
    records_accessed: List[str]
    latency_ms: int


class AIAuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    prompt: str
    response: str
    model_name: str
    tools_called: List[Any]
    records_accessed: List[Any]
    tokens_used: int
    latency_ms: int
    is_rbac_enforced: bool
    created_at: datetime
