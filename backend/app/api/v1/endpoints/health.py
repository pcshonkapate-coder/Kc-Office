import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["System Telemetry"])
def check_health(db: Session = Depends(get_db)):
    """
    Returns system status, database connectivity, latency, and application metadata.
    """
    start = time.time()
    db_status = "connected"
    latency_ms = "0.0"

    try:
        db.execute(text("SELECT 1"))
        latency = (time.time() - start) * 1000
        latency_ms = f"{latency:.2f}"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database={
            "status": db_status,
            "latency_ms": latency_ms,
            "dialect": db.bind.dialect.name if db.bind else "unknown",
        },
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
