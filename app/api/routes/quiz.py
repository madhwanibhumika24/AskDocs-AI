from fastapi import APIRouter

from app.schemas.quiz import QuizRequest, QuizResponse
from app.services.quiz_service import quiz_service

router = APIRouter(
    prefix="/quiz",
    tags=["Quiz"],
)


@router.post(
    "/generate",
    response_model=QuizResponse,
)
async def generate_quiz(
    request: QuizRequest,
):

    result = quiz_service.generate(
        document_id=request.document_id,
        num_questions=request.num_questions,
    )

    return QuizResponse(**result)