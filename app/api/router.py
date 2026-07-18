from fastapi import APIRouter

from app.api.routes.chat import router as chat_router
from app.api.routes.documents import router as document_router
from app.api.routes.flashcards import router as flashcards_router
from app.api.routes.health import router as health_router
from app.api.routes.quiz import router as quiz_router

from auth.router import router as auth_router

router = APIRouter()

router.include_router(health_router)
router.include_router(document_router)
router.include_router(chat_router)
router.include_router(quiz_router)
router.include_router(flashcards_router)
router.include_router(auth_router)