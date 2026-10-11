import logging
import time
from typing import Dict, Optional, Tuple
import redis.asyncio as aioredis
from src.core.config import settings

logger = logging.getLogger("kapate.redis")

redis_pool: Optional[aioredis.ConnectionPool] = None
_in_memory_cache: Dict[str, Tuple[str, float]] = {}


class FallbackRedisClient:
    """In-memory fallback for local development if Redis cluster is offline."""

    async def get(self, key: str) -> Optional[str]:
        if key in _in_memory_cache:
            val, expires_at = _in_memory_cache[key]
            if expires_at and time.time() > expires_at:
                del _in_memory_cache[key]
                return None
            return val
        return None

    async def setex(self, key: str, time_seconds: int, value: str) -> bool:
        _in_memory_cache[key] = (str(value), time.time() + time_seconds)
        return True

    async def delete(self, key: str) -> int:
        if key in _in_memory_cache:
            del _in_memory_cache[key]
            return 1
        return 0

    async def keys(self, pattern: str = "*") -> list[str]:
        import fnmatch
        now = time.time()
        valid_keys = []
        for k, (v, exp) in list(_in_memory_cache.items()):
            if exp and now > exp:
                del _in_memory_cache[k]
                continue
            if fnmatch.fnmatch(k, pattern):
                valid_keys.append(k)
        return valid_keys

    async def ping(self) -> bool:
        return True



async def init_redis_pool() -> None:
    global redis_pool
    try:
        redis_pool = aioredis.ConnectionPool.from_url(
            str(settings.REDIS_URL),
            max_connections=50,
            decode_responses=True,
        )
        # Test connection
        test_client = aioredis.Redis(connection_pool=redis_pool)
        await test_client.ping()
        logger.info("Successfully established connection to Redis cluster.")
    except Exception as e:
        logger.warning(
            f"Redis connection failed ({e}). Falling back to local in-memory session cache for development."
        )
        redis_pool = None


async def close_redis_pool() -> None:
    global redis_pool
    if redis_pool:
        await redis_pool.disconnect()
        redis_pool = None


async def get_redis_client():
    global redis_pool
    if redis_pool is not None:
        try:
            return aioredis.Redis(connection_pool=redis_pool)
        except Exception:
            pass
    return FallbackRedisClient()
