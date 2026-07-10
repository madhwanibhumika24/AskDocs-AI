from fastapi import APIRouter

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
        request.question
    )

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
    )