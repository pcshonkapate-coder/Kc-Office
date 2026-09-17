from abc import ABC, abstractmethod
from typing import Dict, Any, List

class SignatureProvider(ABC):
    """
    Abstract Base Class for E-Signature Provider Adapters.
    Ensures that Kapate OS is not hard-coded to a single provider (like DocuSign).
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the identifier of the provider (e.g., 'docusign', 'zoho_sign', 'mock')"""
        pass

    @abstractmethod
    def create_envelope(self, document_id: str, file_bytes: bytes, signers: List[Dict[str, str]]) -> str:
        """
        Creates a signature envelope/request.
        :param document_id: Internal ManagedDocument ID
        :param file_bytes: The PDF bytes of the document to sign
        :param signers: List of dicts containing 'name', 'email', 'role'
        :return: External envelope ID string
        """
        pass

    @abstractmethod
    def get_envelope_status(self, envelope_id: str) -> str:
        """
        Checks the remote status of the envelope.
        :return: Standardized status string (sent, delivered, completed, declined, voided)
        """
        pass

    @abstractmethod
    def void_envelope(self, envelope_id: str, reason: str) -> bool:
        """
        Voids/cancels an existing envelope.
        """
        pass
