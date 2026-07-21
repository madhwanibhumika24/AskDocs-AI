from fastapi import APIRouter, Depends

from app.schemas.chat import ChatRequest
from app.schemas.citation import ChatResponse
from app.services.chat_service import chat_service
from auth.dependencies import get_current_user

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
    current_user: dict = Depends(get_current_user),
):

    user_id = str(current_user["id"])

    result = chat_service.ask(
        question=request.question,
        user_id=user_id,
        session_id=request.session_id,
        document_id=request.document_id,
        room_id=request.room_id,
    )

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
    )