from app.ai.vectorstores.chroma_store import ChromaStore


class VectorStoreFactory:

    @classmethod
    def get_vectorstore(cls):

        return ChromaStore()