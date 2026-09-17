import uuid
from typing import Dict, Any, List
from .base import SignatureProvider
from app.core.logging import logger

class MockSignatureAdapter(SignatureProvider):
    """
    Mock adapter for local development and testing.
    Simulates sending documents for signature without external API calls.
    """

    @property
    def provider_name(self) -> str:
        return "mock"

    def create_envelope(self, document_id: str, file_bytes: bytes, signers: List[Dict[str, str]]) -> str:
        external_id = f"mock-env-{uuid.uuid4().hex[:8]}"
        logger.info(f"[MockSignature] Created envelope {external_id} for Document {document_id}")
        logger.info(f"[MockSignature] Signers: {signers}")
        return external_id

    def get_envelope_status(self, envelope_id: str) -> str:
        # In a real mock, this might read from a local state or cache.
        # For simple demonstration, assume 'sent' or randomly 'completed'.
        logger.info(f"[MockSignature] Checked status for {envelope_id}")
        return "sent"

    def void_envelope(self, envelope_id: str, reason: str) -> bool:
        logger.info(f"[MockSignature] Voided {envelope_id} due to: {reason}")
        return True
