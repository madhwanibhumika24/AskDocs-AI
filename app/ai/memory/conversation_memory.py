from collections import defaultdict


class ConversationMemory:

    def __init__(self) -> None:

        self.memory = defaultdict(list)

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
    ) -> None:

        self.memory[session_id].append(
            {
                "role": role,
                "content": content,
            }
        )

    def get_history(
        self,
        session_id: str,
    ) -> list[dict]:

        return self.memory.get(session_id, [])

    def clear(
        self,
        session_id: str,
    ) -> None:

        self.memory.pop(session_id, None)


conversation_memory = ConversationMemory()