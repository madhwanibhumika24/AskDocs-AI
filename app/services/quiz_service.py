import json
from typing import Any

from fastapi import HTTPException

from app.ai.llm.llm_factory import LLMFactory
from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory
from app.core.constants import DEFAULT_USER_ID
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

# The instructions we give the AI model for generating a quiz. The two
# {curly brace} spots get filled in with the real values before sending.
QUIZ_PROMPT_TEXT = """You are a quiz generator. Using ONLY the content provided below, \
write exactly {num_questions} quiz questions that test understanding of \
the material.

Use a mix of "multiple_choice" (exactly 4 options) and "true_false" \
(exactly 2 options: "True" and "False") question types.

Respond with ONLY valid JSON — no markdown code fences, no commentary, \
no explanation before or after. Match exactly this shape:

{{
  "questions": [
    {{
      "question": "string",
      "type": "multiple_choice",
      "options": ["string", "string", "string", "string"],
      "correct_answer": "string, must exactly match one of the options"
    }}
  ]
}}

Content:
{context}
"""

QUIZ_PROMPT = ChatPromptTemplate.from_template(QUIZ_PROMPT_TEXT)

# Roughly how many characters of document text we'll send to the AI at
# once, so very large documents don't blow past what the model can handle.
MAX_CONTEXT_CHARACTERS = 12000


class QuizService:
    """
    Generates a quiz (multiple-choice + true/false questions) from a
    document the user has uploaded.

    Unlike chat, this always uses the FULL content of the document —
    there's no "search for relevant chunks" step, because a quiz needs
    to cover the whole document, not just the parts that match a search.
    """

    def __init__(self) -> None:
        self.vectorstore = VectorStoreFactory.get_vectorstore()
        self.llm = LLMFactory.get_llm()
        self.output_parser = StrOutputParser()

    def generate(
        self,
        document_id: str | None = None,
        num_questions: int = 5,
        user_id: str = DEFAULT_USER_ID,
    ) -> dict:

        metadata_filter: dict[str, Any] = {"user_id": user_id}

        if document_id:
            metadata_filter["document_id"] = document_id

        all_chunks = self.vectorstore.get_by_filter(metadata_filter)

        if not all_chunks:
            raise HTTPException(
                status_code=404,
                detail="No document content found to generate a quiz from. "
                       "Upload a document first, or check the document_id.",
            )

        # Combine every chunk's text into one big block of text.
        full_text = ""
        for chunk in all_chunks:
            full_text += chunk.page_content + "\n\n"

        if len(full_text) > MAX_CONTEXT_CHARACTERS:
            full_text = full_text[:MAX_CONTEXT_CHARACTERS]

        raw_response_text = self._ask_llm_for_quiz(full_text, num_questions)

        return self._parse_quiz_json(raw_response_text)

    def _ask_llm_for_quiz(self, context: str, num_questions: int) -> str:
        """
        Sends the document content to the AI model and asks it to write
        quiz questions, returning the AI's raw text response.

        Written as three separate steps instead of one chained pipeline,
        so each step is easy to point to and explain on its own:

          1. Build the actual prompt text from the template
          2. Send that prompt to the AI model
          3. Turn the AI's response into a plain string
        """

        # Step 1: fill in the {context} and {num_questions} blanks.
        filled_in_prompt = QUIZ_PROMPT.format(
            context=context,
            num_questions=num_questions,
        )

        # Step 2: send the finished prompt to the AI model.
        raw_response = self.llm.invoke(filled_in_prompt)

        # Step 3: convert the AI's response object into a plain string.
        response_text = self.output_parser.invoke(raw_response)

        return response_text

    @staticmethod
    def _parse_quiz_json(raw_text: str) -> dict:
        """
        The AI is told to respond with pure JSON, but sometimes wraps it
        in a markdown code block anyway (```json ... ```). This strips
        that off if present, using plain string checks — no regex.
        """

        cleaned_text = raw_text.strip()

        if cleaned_text.startswith("```"):
            # Drop the first line (``` or ```json) and the last line (```).
            lines = cleaned_text.split("\n")
            lines = lines[1:]  # remove first line
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]  # remove last line
            cleaned_text = "\n".join(lines).strip()

        try:
            quiz_data = json.loads(cleaned_text)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=502,
                detail="The AI returned a response that couldn't be parsed "
                       "as a quiz. Please try again.",
            )

        if "questions" not in quiz_data or not isinstance(quiz_data["questions"], list):
            raise HTTPException(
                status_code=502,
                detail="The AI response was missing the expected quiz "
                       "structure. Please try again.",
            )

        return quiz_data


quiz_service = QuizService()