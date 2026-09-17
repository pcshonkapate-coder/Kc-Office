from typing import Dict, Any, Type, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from app.models.auth import User
from app.models.ai import AIAuditLog, AIDraft
from app.services.ai.stubbed_provider import StubbedAIProvider
from app.schemas.ai import AIDraftResponse

class AIService:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        # In production, we could inject an OpenAIProvider or AnthropicProvider here.
        # For Kapate OS architecture validation, we use the Stubbed Provider.
        self.provider = StubbedAIProvider()

    def _log_audit(
        self, 
        feature: str, 
        input_ref: Optional[str], 
        output_preview: str, 
        usage: Dict[str, Any]
    ) -> AIAuditLog:
        """Saves a secure audit log of the AI transaction."""
        audit_log = AIAuditLog(
            user_id=self.user.id,
            feature=feature,
            input_reference=input_ref,
            output_preview=output_preview[:999], # truncate if too long
            model_used=usage.get("model_used", "unknown"),
            usage_metadata=usage
        )
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        return audit_log

    def _save_draft(
        self,
        feature: str,
        content: Dict[str, Any],
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None
    ) -> AIDraft:
        """Saves an AI generation as a PENDING draft for user review."""
        draft = AIDraft(
            user_id=self.user.id,
            entity_id=entity_id,
            entity_type=entity_type,
            feature=feature,
            draft_content=content,
            status="PENDING"
        )
        self.db.add(draft)
        self.db.commit()
        self.db.refresh(draft)
        return draft

    def execute_ai_pipeline(
        self,
        feature_name: str,
        prompt: str,
        response_schema: Type[BaseModel],
        input_ref: Optional[str] = None,
        save_as_draft: bool = False,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None
    ) -> BaseModel:
        """
        Orchestrates the prompt execution, schema parsing, audit logging, 
        and optional draft saving.
        """
        
        # 1. Call the decoupled provider
        parsed_response, usage_meta = self.provider.generate_structured_response(prompt, response_schema)
        
        response_dict = parsed_response.model_dump()
        
        # 2. Log the transaction securely
        output_str = json.dumps(response_dict)
        self._log_audit(
            feature=feature_name,
            input_ref=input_ref,
            output_preview=output_str,
            usage=usage_meta
        )
        
        # 3. Save as draft if required
        if save_as_draft:
            self._save_draft(
                feature=feature_name,
                content=response_dict,
                entity_id=entity_id,
                entity_type=entity_type
            )
            
        return parsed_response

    def get_draft(self, draft_id: str) -> AIDraftResponse:
        draft = self.db.query(AIDraft).filter(AIDraft.id == draft_id).first()
        if not draft:
            raise ValueError("Draft not found")
        return AIDraftResponse.model_validate(draft)
