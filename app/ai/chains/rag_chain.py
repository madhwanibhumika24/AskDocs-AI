from langchain_core.output_parsers import StrOutputParser

from app.ai.chains.prompt_builder import PromptBuilder
from app.ai.llm.llm_factory import LLMFactory
from app.ai.retriever.retriever_factory import RetrieverFactory


class RAGChain:

    def __init__(self) -> None:

        self.retriever = RetrieverFactory.get_retriever()
        self.llm = LLMFactory.get_llm()
        self.prompt = PromptBuilder.get_prompt()
        self.output_parser = StrOutputParser()

    def ask(
        self,
        question: str,
    ) -> dict:

        if not question.strip():
            raise ValueError("Question cannot be empty.")

        documents = self.retriever.retrieve(question)

        context = "\n\n".join(
            document.page_content
            for document in documents
        )

        chain = (
            self.prompt
            | self.llm
            | self.output_parser
        )

        answer = chain.invoke(
            {
                "context": context,
                "question": question,
            }
        )

        return {
            "answer": answer,
            "documents": documents,
        }