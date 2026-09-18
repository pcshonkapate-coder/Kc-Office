from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    app_name: str = Field(..., example="Kapate OS")
    version: str = Field(..., example="0.1.0")
    environment: str = Field(..., example="development")
    database: Dict[str, Any] = Field(..., example={"status": "connected", "latency_ms": "1.2"})
    mongodb: Optional[Dict[str, Any]] = Field(default=None, example={"status": "healthy", "database": "kapate_os", "connected": True})
    timestamp: str

