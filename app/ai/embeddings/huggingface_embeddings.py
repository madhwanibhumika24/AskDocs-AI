from langchain_huggingface import HuggingFaceEmbeddings

from app.ai.embeddings.base_embeddings import BaseEmbeddings
from app.core.config import settings


class HuggingFaceEmbedding(BaseEmbeddings):

    def get_embeddings(self):

        return HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={
                "device": "cpu"
            },
            encode_kwargs={
                "normalize_embeddings": True
            }
        )