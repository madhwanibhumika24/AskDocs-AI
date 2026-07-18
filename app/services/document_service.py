import json
from pathlib import Path
from typing import List

from fastapi import HTTPException, UploadFile

from app.ai.pipeline.ingestion_pipeline import IngestionPipeline
from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory
from app.core.config import settings
from app.core.constants import DEFAULT_USER_ID
from app.utils.file_utils import create_directory, delete_directory
from app.utils.id_generator import generate_document_id
from app.utils.metadata import create_metadata
from app.utils.validators import validate_file_type


class DocumentService:

    def __init__(self) -> None:
        self.ingestion_pipeline = IngestionPipeline()
        self.vectorstore = VectorStoreFactory.get_vectorstore()

    async def upload_documents(
        self,
        files: List[UploadFile],
        user_id: str = DEFAULT_USER_ID,
    ):

        uploaded_documents = []

        for file in files:

            if not validate_file_type(file.filename):
                raise HTTPException(
                    status_code=400,
                    detail=f"{file.filename} is not a supported file type.",
                )

            document_id = generate_document_id()

            document_directory = (
                Path(settings.UPLOAD_DIRECTORY)
                / user_id
                / "documents"
                / document_id
            )

            create_directory(document_directory)

            file_path = document_directory / file.filename

            contents = await file.read()

            with open(file_path, "wb") as buffer:
                buffer.write(contents)

            create_metadata(
                metadata_path=document_directory / "metadata.json",
                document_id=document_id,
                user_id=user_id,
                filename=file.filename,
                file_size=len(contents),
            )

            ingestion_result = self.ingestion_pipeline.process(
                file_path=str(file_path),
                metadata={
                    "user_id": user_id,
                    "document_id": document_id,
                    "filename": file.filename,
                },
            )

            uploaded_documents.append(
                {
                    "document_id": document_id,
                    "filename": file.filename,
                    "file_type": Path(file.filename).suffix.replace(".", ""),
                    "pages": ingestion_result["pages"],
                    "chunks": ingestion_result["chunks"],
                }
            )

        return {
            "success": True,
            "message": "Documents uploaded and indexed successfully.",
            "data": uploaded_documents,
        }

    async def list_documents(
        self,
        user_id: str = DEFAULT_USER_ID,
    ):

        documents_root = (
            Path(settings.UPLOAD_DIRECTORY)
            / user_id
            / "documents"
        )

        if not documents_root.exists():
            return {
                "success": True,
                "data": [],
            }

        documents = []

        for document_dir in documents_root.iterdir():

            if not document_dir.is_dir():
                continue

            metadata_path = document_dir / "metadata.json"

            if not metadata_path.exists():
                continue

            try:
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
            except (json.JSONDecodeError, OSError):
                # Skip corrupted or empty metadata files (e.g. left over
                # from an interrupted upload) instead of failing the
                # whole list request.
                continue

            documents.append(metadata)

        # Sorted newest first if metadata.json includes a timestamp field.
        # If create_metadata() doesn't write one, this just leaves the
        # order as-is (.get returns "" for every item, so nothing errors).
        documents.sort(
            key=lambda d: d.get("uploaded_at", ""),
            reverse=True,
        )

        return {
            "success": True,
            "data": documents,
        }

    async def delete_document(
        self,
        document_id: str,
        user_id: str = DEFAULT_USER_ID,
    ):

        document_directory = (
            Path(settings.UPLOAD_DIRECTORY)
            / user_id
            / "documents"
            / document_id
        )

        if not document_directory.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Document {document_id} not found.",
            )

        # Remove the embedded chunks from ChromaDB first — if this
        # fails, we'd rather keep the files on disk (recoverable)
        # than delete the files but leave orphaned vectors behind
        # (silently wrong answers forever).
        self.vectorstore.delete(
            where={
                "document_id": document_id,
                "user_id": user_id,
            }
        )

        # Remove the file + metadata.json from disk.
        delete_directory(document_directory)

        return {
            "success": True,
            "message": f"Document {document_id} deleted successfully.",
        }


document_service = DocumentService()