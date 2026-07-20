from typing import Optional

from pydantic import BaseModel, Field


class NotesRequest(BaseModel):

    document_id: Optional[str] = Field(
        default=None,
        description="Generate notes from a single document. Omit to draw from every uploaded document.",
        examples=["doc_a1b2c3d4"],
    )


class NoteSection(BaseModel):

    heading: str

    points: list[str]


class NotesResponse(BaseModel):

    sections: list[NoteSection]