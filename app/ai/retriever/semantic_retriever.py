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
    ) -> list[Document]:
        """
        Retrieve the most semantically similar document chunks.
        """

        if not query.strip():
            raise ValueError("Query cannot be empty.")

        return self.vectorstore.similarity_search(
            query=query,
            k=k,
        )