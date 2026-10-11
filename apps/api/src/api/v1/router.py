from fastapi import APIRouter
from src.api.v1.ai.routes import router as ai_router
from src.api.v1.analytics.routes import router as analytics_router
from src.api.v1.approvals.routes import router as approvals_router
from src.api.v1.auth.routes import router as auth_router
from src.api.v1.automations.routes import router as automations_router
from src.api.v1.communication.routes import router as communication_router
from src.api.v1.crm.routes import router as crm_router
from src.api.v1.documents.routes import router as documents_router
from src.api.v1.finance.routes import router as finance_router
from src.api.v1.projects.routes import router as projects_router
from src.api.v1.rbac.routes import router as rbac_router
from src.api.v1.search.routes import router as search_router
from src.api.v1.security.routes import router as security_router
from src.api.v1.workforce.routes import router as workforce_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(rbac_router)
api_v1_router.include_router(workforce_router)
api_v1_router.include_router(crm_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(finance_router)
api_v1_router.include_router(communication_router)
api_v1_router.include_router(approvals_router)
api_v1_router.include_router(automations_router)
api_v1_router.include_router(search_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(security_router)
