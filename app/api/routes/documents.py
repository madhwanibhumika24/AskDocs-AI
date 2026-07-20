from typing import List

from fastapi import APIRouter, Depends, File, UploadFile

from app.services.document_service import document_service
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


@router.post("/upload")
async def upload_documents(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["id"])
    return await document_service.upload_documents(files, user_id=user_id)


@router.get("")
async def list_documents(
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["id"])
    return await document_service.list_documents(user_id=user_id)


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["id"])
    return await document_service.delete_document(document_id, user_id=user_id)