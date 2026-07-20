from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.core.config import settings


class GeminiEmbedding:
    """
    Wraps Gemini's embedding API. This replaces the old local
    sentence-transformers embeddings — no scipy/sklearn/PyTorch
    dependency chain, no local model download, and it uses the same
    Gemini API key you're already using for chat and quiz generation.
    """

    def get_embeddings(self):

        return GoogleGenerativeAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
        )
    


# In gemini_embeddings.py, temporarily:
# print("EMBEDDING_MODEL is:", repr(settings.EMBEDDING_MODEL))