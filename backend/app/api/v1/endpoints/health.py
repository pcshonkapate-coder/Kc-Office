import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.db.mongodb import check_mongo_health, get_mongo_db
from app.core.config import settings
from app.schemas.health import HealthResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["System Telemetry"])
async def check_health(db: Session = Depends(get_db)):
    """
    Returns system status, relational database connectivity, MongoDB status, latency, and application metadata.
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

    mongo_status = await check_mongo_health()

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
        mongodb=mongo_status,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/health/mongo", tags=["System Telemetry"])
async def check_mongo_only(mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)):
    """
    Detailed MongoDB health check & collection statistics.
    """
    start = time.time()
    health = await check_mongo_health()
    latency_ms = (time.time() - start) * 1000
    health["latency_ms"] = f"{latency_ms:.2f}"
    
    try:
        collections = await mongo_db.list_collection_names()
        health["collections"] = collections
    except Exception as exc:
        health["collections_error"] = str(exc)
        
    return health

