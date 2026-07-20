from fastapi import APIRouter

from app.schemas.notes import NotesRequest, NotesResponse
from app.services.notes_service import notes_service

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
):

    result = notes_service.generate(
        document_id=request.document_id,
    )

    return NotesResponse(**result)