from app.ai.chains.rag_chain import RAGChain


class ChatService:

    def __init__(self) -> None:

        self.rag_chain = RAGChain()

    def ask(
        self,
        question: str,
    ) -> str:

        return self.rag_chain.ask(question)


chat_service = ChatService()