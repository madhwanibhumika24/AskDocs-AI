from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):

    session_id: str = Field(
        ...,
        examples=["guest-session"],
    )

    question: str = Field(
        ...,
        min_length=1,
        examples=["What is LangChain?"],
    )

    document_id: Optional[str] = Field(
        default=None,
        description="Scope the question to a single document. Omit to search across every uploaded document.",
        examples=["doc_a1b2c3d4"],
    )