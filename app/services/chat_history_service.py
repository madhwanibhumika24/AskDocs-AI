from auth.database import get_connection

# How many previous messages to pull back in as context. This counts
# BOTH user and assistant messages, so 6 means "the last 3 back-and-forth
# exchanges" — enough for follow-up questions to make sense, without
# sending an ever-growing wall of text to the AI on every message.
MAX_HISTORY_MESSAGES = 6


def save_message(user_id: str, session_id: str, role: str, content: str):
    """
    Saves one message (either the user's question or the AI's answer)
    to the chat_messages table.
    """

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO chat_messages (user_id, session_id, role, content)
        VALUES (%s, %s, %s, %s)
        """,
        (user_id, session_id, role, content),
    )

    connection.commit()
    cursor.close()
    connection.close()


def get_recent_messages(user_id: str, session_id: str) -> list[dict]:
    """
    Returns the most recent messages for this user + session, oldest
    first (so they read top-to-bottom like a real conversation).
    """

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT role, content
        FROM chat_messages
        WHERE user_id = %s AND session_id = %s
        ORDER BY created_at DESC
        LIMIT %s
        """,
        (user_id, session_id, MAX_HISTORY_MESSAGES),
    )

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    # The SQL query above fetches newest-first (so LIMIT grabs the most
    # RECENT messages, not the oldest ones) — but we want to display
    # them oldest-first, so we flip the list before returning it.
    rows.reverse()

    return rows