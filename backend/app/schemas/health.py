from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["healthy"])
    app_name: str = Field(..., examples=["Kapate OS"])
    version: str = Field(..., examples=["0.1.0"])
    environment: str = Field(..., examples=["development"])
    database: Dict[str, Any] = Field(..., examples=[{"status": "connected", "latency_ms": "1.2"}])
    mongodb: Optional[Dict[str, Any]] = Field(default=None, examples=[{"status": "healthy", "database": "kapate_os", "connected": True}])
    timestamp: str

