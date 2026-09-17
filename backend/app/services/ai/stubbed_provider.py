from typing import Dict, Any, Type
from pydantic import BaseModel
import time

from app.services.ai.provider_interface import AIProviderInterface

class StubbedAIProvider(AIProviderInterface):
    """
    A mock AI provider used for local development when API keys are not present.
    It inspects the Pydantic schema and returns a dummy response that fits the schema.
    """
    
    def generate_structured_response(self, prompt: str, schema: Type[BaseModel]) -> tuple[BaseModel, Dict[str, Any]]:
        # Simulate network latency
        time.sleep(1)
        
        # We will generate a generic dict based on the fields of the requested schema
        mock_data = {}
        for field_name, field_info in schema.model_fields.items():
            field_type = str(field_info.annotation).lower()
            if 'list' in field_type:
                mock_data[field_name] = ["AI generated mock item 1", "AI generated mock item 2"]
            elif 'int' in field_type:
                mock_data[field_name] = 85
            elif 'float' in field_type:
                mock_data[field_name] = 0.85
            else:
                # Default string behavior
                if field_name == "complexity" or field_name == "severity" or field_name == "priority_recommendation":
                    mock_data[field_name] = "MEDIUM"
                else:
                    mock_data[field_name] = f"This is an AI generated response for {field_name}."

        parsed_model = schema(**mock_data)
        
        usage_metadata = {
            "model_used": "stubbed-mock-model-v1",
            "prompt_tokens": len(prompt) // 4,
            "completion_tokens": 150,
            "total_tokens": (len(prompt) // 4) + 150,
            "estimated_cost_usd": 0.001
        }
        
        return parsed_model, usage_metadata
