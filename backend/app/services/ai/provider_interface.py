from abc import ABC, abstractmethod
from typing import Dict, Any, Type
from pydantic import BaseModel

class AIProviderInterface(ABC):
    
    @abstractmethod
    def generate_structured_response(self, prompt: str, schema: Type[BaseModel]) -> tuple[BaseModel, Dict[str, Any]]:
        """
        Takes a raw prompt and a Pydantic schema class.
        Returns a tuple: 
        1. An instance of the parsed Pydantic schema
        2. Usage metadata dictionary (tokens, cost, model used)
        """
        pass
