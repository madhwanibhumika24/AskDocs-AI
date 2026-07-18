from typing import Optional

from pydantic import BaseModel, Field


class FlashcardRequest(BaseModel):

    document_id: Optional[str] = Field(
        default=None,
        description="Generate flashcards from a single document. Omit to draw from every uploaded document.",
        examples=["doc_a1b2c3d4"],
    )

    num_cards: int = Field(
        default=10,
        ge=1,
        le=30,
    )


class Flashcard(BaseModel):

    term: str

    definition: str


class FlashcardResponse(BaseModel):

    flashcards: list[Flashcard]