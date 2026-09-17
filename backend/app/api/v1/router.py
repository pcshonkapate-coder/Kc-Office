from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, crm, workforce, delivery, finance, system, public, documents, timesheets, hr, analytics, client, ai, notifications, executive_analytics, identity

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(public.router, prefix="/public")
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(identity.router, prefix="/identity", tags=["Identity & Onboarding"])
api_router.include_router(crm.router, prefix="/crm")
api_router.include_router(workforce.router, prefix="/workforce")
api_router.include_router(delivery.router, prefix="/delivery")
api_router.include_router(finance.router, prefix="/finance")
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(timesheets.router, prefix="/timesheets", tags=["Timesheets"])
api_router.include_router(hr.router, prefix="/hr", tags=["HR"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(client.router, prefix="/client", tags=["Client Portal"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Automation"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(executive_analytics.router, prefix="/executive-analytics", tags=["Executive Analytics"])
api_router.include_router(system.router)
