from app.ai.retriever.semantic_retriever import SemanticRetriever


class RetrieverFactory:

    @classmethod
    def get_retriever(cls) -> SemanticRetriever:
        return SemanticRetriever()