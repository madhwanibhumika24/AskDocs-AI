from app.ai.llm.gemini_llm import GeminiLLM


class LLMFactory:

    _instance = None

    @classmethod
    def get_llm(cls):

        if cls._instance is None:
            cls._instance = GeminiLLM().get_llm()

        return cls._instance