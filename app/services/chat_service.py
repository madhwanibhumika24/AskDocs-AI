from typing import Any

from app.ai.chains.rag_chain import RAGChain
from app.schemas.citation import Source


class ChatService:

    def __init__(self) -> None:

        self.rag_chain = RAGChain()

    def ask(
        self,
        question: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict:

        result = self.rag_chain.ask(
            question=question,
            metadata=metadata,
        )

        answer = result["answer"]

        documents = result["documents"]

        sources = []

        seen = set()

        for document in documents:

            filename = document.metadata.get(
                "filename",
                "Unknown",
            )

            page = document.metadata.get(
                "page",
                0,
            )

            key = (
                filename,
                page,
            )

            if key in seen:
                continue

            seen.add(key)

            sources.append(
                Source(
                    filename=filename,
                    page=page,
                )
            )

        return {
            "answer": answer,
            "sources": sources,
        }


chat_service = ChatService()