from abc import ABC, abstractmethod

from langchain_core.language_models.chat_models import BaseChatModel


class BaseLLM(ABC):

    @abstractmethod
    def get_llm(self) -> BaseChatModel:
        """
        Return a configured LangChain chat model.
        """
        raise NotImplementedError