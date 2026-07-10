from pathlib import Path
from typing import List

from fastapi import HTTPException, UploadFile

from app.ai.pipeline.ingestion_pipeline import IngestionPipeline
from app.core.config import settings
from app.core.constants import DEFAULT_USER_ID
from app.utils.file_utils import create_directory
from app.utils.id_generator import generate_document_id
from app.utils.metadata import create_metadata
from app.utils.validators import validate_file_type


class DocumentService:

    def __init__(self) -> None:
        self.ingestion_pipeline = IngestionPipeline()

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


document_service = DocumentService()