from fastapi import APIRouter, Depends

from app.schemas.notes import NotesRequest, NotesResponse
from app.services.notes_service import notes_service
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/notes",
    tags=["Notes"],
)


@router.post(
    "/generate",
    response_model=NotesResponse,
)
async def generate_notes(
    request: NotesRequest,
    current_user: dict = Depends(get_current_user),
):

    user_id = str(current_user["id"])

    result = notes_service.generate(
        document_id=request.document_id,
        room_id=request.room_id,
        user_id=user_id,
    )

    return NotesResponse(**result)