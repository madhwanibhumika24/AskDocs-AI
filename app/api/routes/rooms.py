from fastapi import APIRouter, Depends, HTTPException

from app.schemas.rooms import RoomCreate
from app.services import room_service
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"],
)


@router.post("")
async def create_room(
    request: RoomCreate,
    current_user: dict = Depends(get_current_user),
):

    user_id = str(current_user["id"])

    room = room_service.create_room(user_id, request.name)

    return {"room": room}


@router.get("")
async def list_rooms(
    current_user: dict = Depends(get_current_user),
):

    user_id = str(current_user["id"])

    rooms = room_service.list_rooms(user_id)

    return {"rooms": rooms}


@router.delete("/{room_id}")
async def delete_room(
    room_id: str,
    current_user: dict = Depends(get_current_user),
):

    user_id = str(current_user["id"])

    was_deleted = room_service.delete_room(user_id, room_id)

    if not was_deleted:
        raise HTTPException(
            status_code=404,
            detail="Room not found.",
        )

    return {"message": "Room deleted."}