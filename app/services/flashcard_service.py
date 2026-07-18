import json
from typing import Any

from fastapi import HTTPException

from app.ai.llm.llm_factory import LLMFactory
from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory
from app.core.constants import DEFAULT_USER_ID
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

# The instructions we give the AI model for generating flashcards. The
# two {curly brace} spots get filled in with real values before sending.
FLASHCARD_PROMPT_TEXT = """You are a flashcard generator. Using ONLY the content provided below, \
create exactly {num_cards} flashcards that help someone study and remember \
the important terms, concepts, and ideas in this material.

Each flashcard has two parts:
- "term": a short key word, phrase, or concept from the content
- "definition": a clear, simple explanation of that term, in your own words

Respond with ONLY valid JSON — no markdown code fences, no commentary, \
no explanation before or after. Match exactly this shape:

{{
  "flashcards": [
    {{
      "term": "string",
      "definition": "string"
    }}
  ]
}}

Content:
{context}
"""

FLASHCARD_PROMPT = ChatPromptTemplate.from_template(FLASHCARD_PROMPT_TEXT)

# Roughly how many characters of document text we'll send to the AI at
# once, so very large documents don't blow past what the model can handle.
MAX_CONTEXT_CHARACTERS = 12000


class FlashcardService:
    """
    Generates study flashcards (term + definition pairs) from a document
    the user has uploaded.

    Just like quizzes, this always uses the FULL content of the document
    rather than searching for "relevant" chunks — flashcards need to
    cover the whole document, not just the parts that match a search.
    """

    def __init__(self) -> None:
        self.vectorstore = VectorStoreFactory.get_vectorstore()
        self.llm = LLMFactory.get_llm()
        self.output_parser = StrOutputParser()

    def generate(
        self,
        document_id: str | None = None,
        num_cards: int = 10,
        user_id: str = DEFAULT_USER_ID,
    ) -> dict:

        metadata_filter: dict[str, Any] = {"user_id": user_id}

        if document_id:
            metadata_filter["document_id"] = document_id

        all_chunks = self.vectorstore.get_by_filter(metadata_filter)

        if not all_chunks:
            raise HTTPException(
                status_code=404,
                detail="No document content found to generate flashcards from. "
                       "Upload a document first, or check the document_id.",
            )

        # Combine every chunk's text into one big block of text.
        full_text = ""
        for chunk in all_chunks:
            full_text += chunk.page_content + "\n\n"

        if len(full_text) > MAX_CONTEXT_CHARACTERS:
            full_text = full_text[:MAX_CONTEXT_CHARACTERS]

        raw_response_text = self._ask_llm_for_flashcards(full_text, num_cards)

        return self._parse_flashcard_json(raw_response_text)

    def _ask_llm_for_flashcards(self, context: str, num_cards: int) -> str:
        """
        Sends the document content to the AI model and asks it to write
        flashcards, returning the AI's raw text response.

        Written as three separate steps instead of one chained pipeline,
        so each step is easy to point to and explain on its own:

          1. Build the actual prompt text from the template
          2. Send that prompt to the AI model
          3. Turn the AI's response into a plain string
        """

        filled_in_prompt = FLASHCARD_PROMPT.format(
            context=context,
            num_cards=num_cards,
        )

        raw_response = self.llm.invoke(filled_in_prompt)

        response_text = self.output_parser.invoke(raw_response)

        return response_text

    @staticmethod
    def _parse_flashcard_json(raw_text: str) -> dict:
        """
        The AI is told to respond with pure JSON, but sometimes wraps it
        in a markdown code block anyway (```json ... ```). This strips
        that off if present, using plain string checks — no regex.
        """

        cleaned_text = raw_text.strip()

        if cleaned_text.startswith("```"):
            lines = cleaned_text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned_text = "\n".join(lines).strip()

        try:
            flashcard_data = json.loads(cleaned_text)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=502,
                detail="The AI returned a response that couldn't be parsed "
                       "as flashcards. Please try again.",
            )

        if "flashcards" not in flashcard_data or not isinstance(flashcard_data["flashcards"], list):
            raise HTTPException(
                status_code=502,
                detail="The AI response was missing the expected flashcard "
                       "structure. Please try again.",
            )

        return flashcard_data


flashcard_service = FlashcardService()