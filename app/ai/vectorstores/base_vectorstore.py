from abc import ABC, abstractmethod

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
    ):
        """
        Perform semantic search.
        """
        raise NotImplementedError