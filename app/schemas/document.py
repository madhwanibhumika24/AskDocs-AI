from pydantic import BaseModel


class UploadedDocument(BaseModel):
    document_id: str
    filename: str
    file_type: str