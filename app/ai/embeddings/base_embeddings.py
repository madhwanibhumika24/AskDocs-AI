from abc import ABC, abstractmethod
from langchain_core.embeddings import Embeddings


class BaseEmbeddings(ABC):

    @abstractmethod
    def get_embeddings(self) -> Embeddings:
        """Return a LangChain Embeddings instance."""
        raise NotImplementedError