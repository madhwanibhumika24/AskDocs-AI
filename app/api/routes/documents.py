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


@router.get("")
async def list_documents():
    return await document_service.list_documents()


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    return await document_service.delete_document(document_id)