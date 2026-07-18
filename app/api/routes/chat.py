from fastapi import APIRouter

from app.core.constants import DEFAULT_USER_ID
from app.schemas.chat import ChatRequest
from app.schemas.citation import ChatResponse
from app.services.chat_service import chat_service

router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


@router.post(
    "",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest,
):

    result = chat_service.ask(
        question=request.question,
        user_id=DEFAULT_USER_ID,
        document_id=request.document_id,
    )

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
    )