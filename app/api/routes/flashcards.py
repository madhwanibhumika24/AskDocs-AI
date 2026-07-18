from fastapi import APIRouter

from app.schemas.flashcards import FlashcardRequest, FlashcardResponse
from app.services.flashcard_service import flashcard_service

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
):

    result = flashcard_service.generate(
        document_id=request.document_id,
        num_cards=request.num_cards,
    )

    return FlashcardResponse(**result)