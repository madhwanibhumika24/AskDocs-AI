from langchain_chroma import Chroma

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
    ):

        return self.vectorstore.similarity_search(
            query=query,
            k=k,
        )