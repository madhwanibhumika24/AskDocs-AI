from typing import Any

from langchain_chroma import Chroma
from langchain_core.documents import Document

from app.ai.embeddings.embedding_factory import EmbeddingFactory
from app.ai.vectorstores.base_vectorstore import BaseVectorStore
from app.core.config import settings


class ChromaStore(BaseVectorStore):

    def __init__(self):

        self.vectorstore = Chroma(
            persist_directory=settings.CHROMA_DIRECTORY,
            embedding_function=EmbeddingFactory.get_embeddings(),
        )

    def add_documents(self, documents):

        self.vectorstore.add_documents(documents)

    def similarity_search(
        self,
        query: str,
        k: int = 5,
        filter: dict[str, Any] | None = None,
    ):

        search_kwargs = {
            "query": query,
            "k": k,
        }

        if filter:
            search_kwargs["filter"] = self._build_where(filter)

        return self.vectorstore.similarity_search(
            **search_kwargs
        )

    def delete(
        self,
        where: dict[str, Any],
    ):
        """
        Delete every chunk matching the given metadata filter.

        langchain_chroma's Chroma wrapper only exposes delete-by-id
        directly, so this reaches into the underlying chromadb
        collection to delete by metadata (the standard workaround
        until langchain_chroma exposes this natively).
        """

        if not where:
            raise ValueError(
                "Refusing to call delete() with an empty filter — "
                "this would risk deleting the entire collection."
            )

        collection = self.vectorstore._collection
        collection.delete(where=self._build_where(where))

    def get_by_filter(
        self,
        where: dict[str, Any],
    ) -> list[Document]:

        if not where:
            raise ValueError("get_by_filter() requires a non-empty filter.")

        collection = self.vectorstore._collection

        result = collection.get(
            where=self._build_where(where),
            include=["documents", "metadatas"],
        )

        contents = result.get("documents") or []
        metadatas = result.get("metadatas") or []

        return [
            Document(page_content=content, metadata=metadata or {})
            for content, metadata in zip(contents, metadatas)
        ]

    @staticmethod
    def _build_where(filter: dict[str, Any]) -> dict[str, Any]:
        """
        Chroma requires an explicit $and when filtering on more than
        one field. A single-key filter can be passed as-is.
        """

        if len(filter) <= 1:
            return filter

        return {
            "$and": [
                {key: value}
                for key, value in filter.items()
            ]
        }