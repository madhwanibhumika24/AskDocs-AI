import json
from typing import Any

from fastapi import HTTPException

from app.ai.llm.llm_factory import LLMFactory
from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory
from app.core.constants import DEFAULT_USER_ID
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

# The instructions we give the AI model for generating study notes.
NOTES_PROMPT_TEXT = """You are a study notes generator. Using ONLY the content \
provided below, organize the material into clear study notes.

Break the content into logical sections. Each section has:
- "heading": a short section title
- "points": a list of concise bullet points covering the key information \
in that section (plain statements, not questions)

Aim for 3-6 sections, each with 3-6 bullet points. Cover the material \
thoroughly but keep each point short and easy to scan.

Respond with ONLY valid JSON — no markdown code fences, no commentary, \
no explanation before or after. Match exactly this shape:

{{
  "sections": [
    {{
      "heading": "string",
      "points": ["string", "string", "string"]
    }}
  ]
}}

Content:
{context}
"""

NOTES_PROMPT = ChatPromptTemplate.from_template(NOTES_PROMPT_TEXT)

# Roughly how many characters of document text we'll send to the AI at
# once, so very large documents don't blow past what the model can handle.
MAX_CONTEXT_CHARACTERS = 12000


class NotesService:
    """
    Generates structured study notes (headings + bullet points) from a
    document the user has uploaded.

    Like quizzes and flashcards, this always uses the FULL content of
    the document rather than searching for "relevant" chunks — notes
    need to cover the whole document, not just parts that match a
    search.
    """

    def __init__(self) -> None:
        self.vectorstore = VectorStoreFactory.get_vectorstore()
        self.llm = LLMFactory.get_llm()
        self.output_parser = StrOutputParser()

    def generate(
        self,
        document_id: str | None = None,
        user_id: str = DEFAULT_USER_ID,
    ) -> dict:

        metadata_filter: dict[str, Any] = {"user_id": user_id}

        if document_id:
            metadata_filter["document_id"] = document_id

        all_chunks = self.vectorstore.get_by_filter(metadata_filter)

        if not all_chunks:
            raise HTTPException(
                status_code=404,
                detail="No document content found to generate notes from. "
                       "Upload a document first, or check the document_id.",
            )

        # Combine every chunk's text into one big block of text.
        full_text = ""
        for chunk in all_chunks:
            full_text += chunk.page_content + "\n\n"

        if len(full_text) > MAX_CONTEXT_CHARACTERS:
            full_text = full_text[:MAX_CONTEXT_CHARACTERS]

        raw_response_text = self._ask_llm_for_notes(full_text)

        return self._parse_notes_json(raw_response_text)

    def _ask_llm_for_notes(self, context: str) -> str:
        """
        Sends the document content to the AI model and asks it to write
        study notes, returning the AI's raw text response.

        Written as three separate steps instead of one chained
        pipeline:
          1. Build the actual prompt text from the template
          2. Send that prompt to the AI model
          3. Turn the AI's response into a plain string
        """

        filled_in_prompt = NOTES_PROMPT.format(context=context)

        raw_response = self.llm.invoke(filled_in_prompt)

        response_text = self.output_parser.invoke(raw_response)

        return response_text

    @staticmethod
    def _parse_notes_json(raw_text: str) -> dict:
        """
        The AI is told to respond with pure JSON, but sometimes wraps it
        in a markdown code block anyway. This strips that off if
        present, using plain string checks — no regex.
        """

        cleaned_text = raw_text.strip()

        if cleaned_text.startswith("```"):
            lines = cleaned_text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned_text = "\n".join(lines).strip()

        try:
            notes_data = json.loads(cleaned_text)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=502,
                detail="The AI returned a response that couldn't be parsed "
                       "as notes. Please try again.",
            )

        if "sections" not in notes_data or not isinstance(notes_data["sections"], list):
            raise HTTPException(
                status_code=502,
                detail="The AI response was missing the expected notes "
                       "structure. Please try again.",
            )

        return notes_data


notes_service = NotesService()