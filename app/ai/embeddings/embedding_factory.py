from app.ai.embeddings.huggingface_embeddings import HuggingFaceEmbedding


class EmbeddingFactory:

    @classmethod
    def get_embeddings(cls):
        return HuggingFaceEmbedding().get_embeddings()