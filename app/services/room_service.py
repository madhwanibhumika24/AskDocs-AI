from auth.database import get_connection


def create_room(user_id: str, name: str) -> dict:
    """
    Creates a new room for this user and returns it.
    """

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "INSERT INTO rooms (user_id, name) VALUES (%s, %s)",
        (user_id, name),
    )

    connection.commit()

    new_room_id = cursor.lastrowid

    cursor.close()
    connection.close()

    return {
        "id": new_room_id,
        "user_id": user_id,
        "name": name,
    }


def list_rooms(user_id: str) -> list[dict]:
    """
    Returns every room that belongs to this user, newest first.
    """

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, name, created_at FROM rooms WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,),
    )

    rooms = cursor.fetchall()

    cursor.close()
    connection.close()

    return rooms


def get_room(user_id: str, room_id: str) -> dict | None:
    """
    Returns one specific room, but ONLY if it actually belongs to this
    user — this is what stops one user from being able to view or
    delete another user's room just by guessing its ID.
    """

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, name, created_at FROM rooms WHERE id = %s AND user_id = %s",
        (room_id, user_id),
    )

    room = cursor.fetchone()

    cursor.close()
    connection.close()

    return room


def delete_room(user_id: str, room_id: str) -> bool:
    """
    Deletes a room. This does NOT delete the documents inside it —
    they just become "unassigned" again, still fully intact and still
    visible in the regular Documents view. Returns True if a room was
    actually deleted, False if no matching room was found.
    """

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM rooms WHERE id = %s AND user_id = %s",
        (room_id, user_id),
    )

    connection.commit()

    deleted_count = cursor.rowcount

    cursor.close()
    connection.close()

    return deleted_count > 0