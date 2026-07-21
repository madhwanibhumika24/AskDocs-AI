import json
from typing import Any

from fastapi import HTTPException

from app.ai.llm.llm_factory import LLMFactory
from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory
from app.core.constants import DEFAULT_USER_ID
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

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

MAX_CONTEXT_CHARACTERS = 12000


class NotesService:
    """
    Generates structured study notes from a document — or now, from
    every document in a room — the user has uploaded. Always uses the
    FULL content, never a similarity search.
    """

    def __init__(self) -> None:
        self.vectorstore = VectorStoreFactory.get_vectorstore()
        self.llm = LLMFactory.get_llm()
        self.output_parser = StrOutputParser()

    def generate(
        self,
        document_id: str | None = None,
        room_id: str | None = None,
        user_id: str = DEFAULT_USER_ID,
    ) -> dict:

        metadata_filter: dict[str, Any] = {"user_id": user_id}

        if room_id:
            metadata_filter["room_id"] = room_id
        elif document_id:
            metadata_filter["document_id"] = document_id

        all_chunks = self.vectorstore.get_by_filter(metadata_filter)

        if not all_chunks:
            raise HTTPException(
                status_code=404,
                detail="No document content found to generate notes from. "
                       "Upload a document first, or check the document_id/room_id.",
            )

        full_text = ""
        for chunk in all_chunks:
            full_text += chunk.page_content + "\n\n"

        if len(full_text) > MAX_CONTEXT_CHARACTERS:
            full_text = full_text[:MAX_CONTEXT_CHARACTERS]

        raw_response_text = self._ask_llm_for_notes(full_text)

        return self._parse_notes_json(raw_response_text)

    def _ask_llm_for_notes(self, context: str) -> str:

        filled_in_prompt = NOTES_PROMPT.format(context=context)

        raw_response = self.llm.invoke(filled_in_prompt)

        response_text = self.output_parser.invoke(raw_response)

        return response_text

    @staticmethod
    def _parse_notes_json(raw_text: str) -> dict:

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