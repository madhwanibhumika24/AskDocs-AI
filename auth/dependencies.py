from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from .auth import decode_access_token
from .database import get_connection

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Reads the JWT from the Authorization header, decodes it, and looks
    up the real user row in MySQL. Any route that needs to know "who
    is making this request" depends on this function.

    Usage in a route file:

        from auth.dependencies import get_current_user

        @router.post("/upload")
        async def upload_documents(
            files: List[UploadFile] = File(...),
            current_user: dict = Depends(get_current_user),
        ):
            user_id = str(current_user["id"])
            ...
    """

    token = credentials.credentials

    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, full_name, email, role, is_verified FROM users WHERE id=%s",
            (user_id,),
        )

        user = cursor.fetchone()

        cursor.close()
        connection.close()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")