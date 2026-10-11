import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.v1.router import api_v1_router
from src.core.config import settings
from src.core.database import Base, engine
from src.core.redis import close_redis_pool, init_redis_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Redis pool & verify DB connectivity / tables
    await init_redis_pool()
    async with engine.begin() as conn:
        # Create all tables on startup if not present (Alembic handles migrations in CI/CD)
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: Cleanly close pools
    await close_redis_pool()
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    start_time = time.perf_counter()

    response = await call_next(request)

    process_time = time.perf_counter() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type": "https://api.kapateconsultancy.com/v3/errors/internal-error",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "An unexpected server error occurred. Please contact systems support.",
            "instance": request.url.path,
            "code": "ERR_INTERNAL_SERVER_ERROR",
            "request_id": req_id,
        },
    )


# Attach Domain Routers
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Telemetry"])
async def health_check():
    return {
        "status": "healthy",
        "system": "KAPATE OS 3.0 API Core",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }
