from typing import Any

from langchain_core.documents import Document

from app.ai.retriever.base_retriever import BaseRetriever
from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory
from app.core.config import settings


class SemanticRetriever(BaseRetriever):

    def __init__(self) -> None:
        self.vectorstore = VectorStoreFactory.get_vectorstore()

    def retrieve(
        self,
        query: str,
        k: int = settings.TOP_K_RESULTS,
        metadata: dict[str, Any] | None = None,
    ) -> list[Document]:
        """
        Retrieve the most semantically similar document chunks.
        """

        if not query.strip():
            raise ValueError("Query cannot be empty.")

        search_kwargs = {
            "query": query,
            "k": k,
        }

        if metadata:
            search_kwargs["filter"] = metadata

        return self.vectorstore.similarity_search(
            **search_kwargs
        )