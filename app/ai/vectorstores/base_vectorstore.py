from abc import ABC, abstractmethod
from typing import Any

from langchain_core.documents import Document


class BaseVectorStore(ABC):

    @abstractmethod
    def add_documents(
        self,
        documents: list[Document],
    ):
        """
        Store documents inside the vector database.
        """
        raise NotImplementedError

    @abstractmethod
    def similarity_search(
        self,
        query: str,
        k: int = 5,
        filter: dict[str, Any] | None = None,
    ):
        """
        Perform semantic search, optionally scoped to a metadata filter
        (e.g. {"user_id": "..."} or {"document_id": "..."}).
        """
        raise NotImplementedError

    @abstractmethod
    def delete(
        self,
        where: dict[str, Any],
    ):
        """
        Delete all chunks matching a metadata filter
        (e.g. {"document_id": "doc_abc123"}).
        """
        raise NotImplementedError

    @abstractmethod
    def get_by_filter(
        self,
        where: dict[str, Any],
    ) -> list[Document]:
        """
        Fetch ALL chunks matching a metadata filter — unlike
        similarity_search, this is not query-based, it returns every
        matching chunk. Used for tasks that need a document's full
        content (quiz generation, summaries) rather than the chunks
        most relevant to a specific question.
        """
        raise NotImplementedError