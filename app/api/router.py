from fastapi import APIRouter

from app.api.routes.chat import router as chat_router
from app.api.routes.documents import router as document_router
from app.api.routes.health import router as health_router

router = APIRouter()

router.include_router(health_router)
router.include_router(document_router)
router.include_router(chat_router)