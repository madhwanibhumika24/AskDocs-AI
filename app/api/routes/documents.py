from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.services.document_service import document_service
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


@router.post("/upload")
async def upload_documents(
    files: List[UploadFile] = File(...),
    room_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["id"])
    return await document_service.upload_documents(
        files,
        user_id=user_id,
        room_id=room_id,
    )


@router.get("")
async def list_documents(
    room_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["id"])
    return await document_service.list_documents(
        user_id=user_id,
        room_id=room_id,
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["id"])
    return await document_service.delete_document(document_id, user_id=user_id)