import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("kapate.mongodb")


class MongoDBManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


mongo_manager = MongoDBManager()


async def connect_to_mongo() -> None:
    """Initialize asynchronous MongoDB client connection pool."""
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL.split('@')[-1]} (DB: {settings.MONGODB_DB_NAME})...")
        mongo_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
            maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
            serverSelectionTimeoutMS=3000,
        )
        mongo_manager.db = mongo_manager.client[settings.MONGODB_DB_NAME]
        
        # Test connection ping
        await mongo_manager.client.admin.command("ping")
        logger.info(f"Connected to MongoDB successfully. Database: '{settings.MONGODB_DB_NAME}'")
    except Exception as exc:
        logger.warning(
            f"MongoDB connection could not be established at startup: {exc}. "
            "Async operations requiring MongoDB will retry or fallback."
        )


async def close_mongo_connection() -> None:
    """Gracefully close MongoDB client connection pool."""
    if mongo_manager.client is not None:
        logger.info("Closing MongoDB connection pool...")
        mongo_manager.client.close()
        mongo_manager.client = None
        mongo_manager.db = None
        logger.info("MongoDB connection closed.")


async def check_mongo_health() -> dict:
    """Check MongoDB live ping and return connection status details."""
    if mongo_manager.client is None:
        return {
            "status": "disconnected",
            "database": settings.MONGODB_DB_NAME,
            "error": "MongoDB client is not initialized",
        }
    try:
        await mongo_manager.client.admin.command("ping")
        return {
            "status": "healthy",
            "database": settings.MONGODB_DB_NAME,
            "connected": True,
        }
    except Exception as exc:
        return {
            "status": "unhealthy",
            "database": settings.MONGODB_DB_NAME,
            "error": str(exc),
            "connected": False,
        }


async def get_mongo_db() -> AsyncIOMotorDatabase:
    """FastAPI Dependency: yields or returns the active AsyncIOMotorDatabase."""
    if mongo_manager.db is None:
        # Lazy fallback attempt if client wasn't connected at boot
        if mongo_manager.client is None:
            mongo_manager.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
                maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
                serverSelectionTimeoutMS=3000,
            )
        mongo_manager.db = mongo_manager.client[settings.MONGODB_DB_NAME]
    return mongo_manager.db


async def get_mongo_client() -> AsyncIOMotorClient:
    """FastAPI Dependency: yields or returns the active AsyncIOMotorClient."""
    if mongo_manager.client is None:
        mongo_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
            maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
            serverSelectionTimeoutMS=3000,
        )
    return mongo_manager.client
