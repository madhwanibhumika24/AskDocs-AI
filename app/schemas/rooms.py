from pydantic import BaseModel, Field


class RoomCreate(BaseModel):

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        examples=["Physics"],
    )


class Room(BaseModel):

    id: int

    name: str