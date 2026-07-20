from fastapi import APIRouter, Depends

from app.schemas.quiz import QuizRequest, QuizResponse
from app.services.quiz_service import quiz_service
from auth.dependencies import get_current_user

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
    current_user: dict = Depends(get_current_user),
):

    user_id = str(current_user["id"])

    result = quiz_service.generate(
        document_id=request.document_id,
        num_questions=request.num_questions,
        user_id=user_id,
    )

    return QuizResponse(**result)