from langchain_google_genai import ChatGoogleGenerativeAI

from app.ai.llm.base_llm import BaseLLM
from app.core.config import settings


class GeminiLLM(BaseLLM):

    def __init__(self) -> None:
        self.model = settings.LLM_MODEL
        self.api_key = settings.GEMINI_API_KEY

    def get_llm(self) -> ChatGoogleGenerativeAI:

        return ChatGoogleGenerativeAI(
            model=self.model,
            google_api_key=self.api_key,
            temperature=0,
        )