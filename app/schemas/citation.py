from pydantic import BaseModel


class Source(BaseModel):

    filename: str

    page: int


class ChatResponse(BaseModel):

    answer: str

    sources: list[Source]