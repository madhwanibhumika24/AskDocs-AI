from app.ai.embeddings.gemini_embeddings import GeminiEmbedding


class EmbeddingFactory:

    @classmethod
    def get_embeddings(cls):
        return GeminiEmbedding().get_embeddings()