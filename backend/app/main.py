import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import KapateAppException
from app.api.v1.router import api_router
from app.db.base import Base
from app.db.session import engine
import app.models
from app.db.events import configure_audit_logging
from app.db.mongodb import connect_to_mongo, close_mongo_connection

# Configure SQLAlchemy event listeners and auto-create metadata tables
configure_audit_logging()
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize MongoDB connection pool
    await connect_to_mongo()
    yield
    # Shutdown: Gracefully close MongoDB connection pool
    await close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Kapate OS - Enterprise Business Operating System API for Kapate Consultancy",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID & Audit Logging Middleware
@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"

    logger.info(
        f"[{request_id}] {request.method} {request.url.path} - "
        f"Status: {response.status_code} ({duration_ms:.2f}ms)"
    )
    return response


# Centralized Exception Handlers
@app.exception_handler(KapateAppException)
async def kapate_app_exception_handler(request: Request, exc: KapateAppException):
    request_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "meta": {
                "request_id": request_id,
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", "unknown")
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        errors.append({"field": loc, "message": err.get("msg")})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed.",
                "details": errors,
            },
            "meta": {
                "request_id": request_id,
            },
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.exception(f"[{request_id}] Unhandled Exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred. Please contact support with the Request ID.",
            },
            "meta": {
                "request_id": request_id,
            },
        },
    )


# Register API v1 Routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }
