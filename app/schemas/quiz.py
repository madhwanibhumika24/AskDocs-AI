from typing import Literal, Optional

from pydantic import BaseModel, Field


class QuizRequest(BaseModel):

    document_id: Optional[str] = Field(
        default=None,
        description="Generate the quiz from a single document. Omit to draw from every uploaded document.",
        examples=["doc_a1b2c3d4"],
    )

    num_questions: int = Field(
        default=5,
        ge=1,
        le=20,
    )


class QuizQuestion(BaseModel):

    question: str

    type: Literal["multiple_choice", "true_false"]

    options: list[str]

    correct_answer: str


class QuizResponse(BaseModel):

    questions: list[QuizQuestion]