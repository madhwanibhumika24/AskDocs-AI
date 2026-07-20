from fastapi import APIRouter, Depends

from app.schemas.flashcards import FlashcardRequest, FlashcardResponse
from app.services.flashcard_service import flashcard_service
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/flashcards",
    tags=["Flashcards"],
)


@router.post(
    "/generate",
    response_model=FlashcardResponse,
)
async def generate_flashcards(
    request: FlashcardRequest,
    current_user: dict = Depends(get_current_user),
):

    user_id = str(current_user["id"])

    result = flashcard_service.generate(
        document_id=request.document_id,
        num_cards=request.num_cards,
        user_id=user_id,
    )

    return FlashcardResponse(**result)