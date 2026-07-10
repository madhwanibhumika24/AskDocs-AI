from abc import ABC, abstractmethod

from langchain_core.documents import Document


class BaseRetriever(ABC):

    @abstractmethod
    def retrieve(
        self,
        query: str,
        k: int = 5,
    ) -> list[Document]:
        """
        Retrieve the most relevant documents.
        """
        raise NotImplementedError