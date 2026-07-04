from typing import List

from fastapi import APIRouter, File, UploadFile

from app.services.document_service import document_service

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


@router.post("/upload")
async def upload_documents(
    files: List[UploadFile] = File(...)
):
    return await document_service.upload_documents(files)