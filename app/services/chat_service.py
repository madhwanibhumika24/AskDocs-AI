from typing import Any

from app.ai.chains.rag_chain import RAGChain
from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory
from app.schemas.citation import Source
from app.services import chat_history_service

# If the question contains any of these words/phrases, we treat it as a
# "broad" question — the person wants an overview of the WHOLE document,
# not one specific fact. Plain keyword matching, no regex — easy to read
# and easy to add new phrases to later.
BROAD_QUESTION_KEYWORDS = [
    "summarize",
    "summarise",
    "summary",
    "overview",
    "what is this document",
    "what is this about",
    "what's this about",
    "key points",
    "key takeaways",
    "main points",
    "main ideas",
    "explain this document",
    "tldr",
    "tl;dr",
]

# Roughly how many characters of document text we'll send to the AI at
# once. Very large documents get cut off here so we don't send more text
# than the AI model can handle in one request.
MAX_CONTEXT_CHARACTERS = 12000


class ChatService:
    """
    Handles answering user questions using the documents they've uploaded.

    Two different strategies are used depending on the question:

    1. SPECIFIC questions ("what dosage is mentioned on page 3?") use
       normal retrieval — we search for the few most relevant chunks of
       text and only show the AI those.

    2. BROAD questions ("summarize this document") use the FULL document
       instead — searching for "relevant chunks" doesn't work well for a
       question that isn't really about one specific fact.

    In both cases, recent conversation history is included so the AI
    has context for follow-up questions like "what about that" or
    "explain more" — without that history, every question would be
    answered completely in isolation, with zero memory of what was
    just discussed.
    """

    def __init__(self) -> None:
        self.rag_chain = RAGChain()
        self.vectorstore = VectorStoreFactory.get_vectorstore()

    def ask(
        self,
        question: str,
        user_id: str,
        session_id: str,
        document_id: str | None = None,
    ) -> dict:

        if not question.strip():
            raise ValueError("Question cannot be empty.")

        # Every search is scoped to this user's own documents.
        metadata_filter: dict[str, Any] = {"user_id": user_id}

        # If a specific document was picked, only search inside that one.
        if document_id:
            metadata_filter["document_id"] = document_id

        # Pull in recent conversation history and weave it into the
        # question before answering — the AI sees the history, but we
        # still store the ORIGINAL plain question in the database, not
        # this combined version (otherwise history would keep stacking
        # on top of itself every single turn).
        history = chat_history_service.get_recent_messages(user_id, session_id)
        question_with_history = self._add_history_to_question(question, history)

        # Broad questions only get the "send the whole document" treatment
        # when a specific document is selected. Without a document_id, we
        # don't know which document(s) to send in full, so we fall back
        # to normal search instead.
        question_is_broad = self._is_broad_question(question)

        if document_id and question_is_broad:
            result = self._answer_using_whole_document(question_with_history, metadata_filter)
        else:
            result = self._answer_using_search(question_with_history, metadata_filter)

        # Save this exchange so the NEXT question in this session can
        # see it too.
        chat_history_service.save_message(user_id, session_id, "user", question)
        chat_history_service.save_message(user_id, session_id, "assistant", result["answer"])

        return result

    @staticmethod
    def _add_history_to_question(question: str, history: list[dict]) -> str:
        """
        Builds a single block of text that includes recent conversation
        history followed by the new question — this is what actually
        gets sent to the AI as "the question." If there's no history
        yet (first message in a session), this just returns the
        question unchanged.
        """

        if not history:
            return question

        history_lines = []

        for message in history:
            speaker = "User" if message["role"] == "user" else "Assistant"
            history_lines.append(f"{speaker}: {message['content']}")

        history_text = "\n".join(history_lines)

        return (
            f"Here is the recent conversation so far, for context:\n"
            f"{history_text}\n\n"
            f"Now answer this new question. Use the conversation above only "
            f"to understand what the person is referring to (like \"it\" or "
            f"\"that\") — the actual answer must still come from the "
            f"document content, not from the conversation history itself.\n\n"
            f"New question: {question}"
        )

    def _answer_using_search(
        self,
        question: str,
        metadata_filter: dict[str, Any],
    ) -> dict:
        """
        Normal path: search for the most relevant chunks of text, then
        ask the AI to answer using only those chunks.
        """

        result = self.rag_chain.ask(
            question=question,
            metadata=metadata_filter,
        )

        return {
            "answer": result["answer"],
            "sources": self._build_source_list(result["documents"]),
        }

    def _answer_using_whole_document(
        self,
        question: str,
        metadata_filter: dict[str, Any],
    ) -> dict:
        """
        Broad-question path: fetch every chunk of the selected document
        (not just the "most relevant" ones) and give the AI the whole
        thing to work with.
        """

        all_chunks = self.vectorstore.get_by_filter(metadata_filter)

        # If nothing matched (e.g. a bad document_id was sent), just
        # fall back to a normal search instead of returning an error.
        if not all_chunks:
            return self._answer_using_search(question, metadata_filter)

        # Combine every chunk's text into one big block of text.
        full_text = ""
        for chunk in all_chunks:
            full_text += chunk.page_content + "\n\n"

        if len(full_text) > MAX_CONTEXT_CHARACTERS:
            full_text = full_text[:MAX_CONTEXT_CHARACTERS]

        answer = self._ask_llm_with_context(question, full_text)

        return {
            "answer": answer,
            "sources": self._build_source_list(all_chunks),
        }

    def _ask_llm_with_context(self, question: str, context: str) -> str:
        """
        Sends a question + some reference text to the AI model and
        returns its plain-text answer.

        This does the same three things every AI call needs to do, just
        written out as three separate steps instead of chained together
        with the "|" pipe operator, so it's easier to follow:

          1. Build the actual prompt text from a template
          2. Send that prompt to the AI model
          3. Turn the AI's response into a plain string
        """

        # Step 1: fill in the {context} and {question} blanks in the
        # prompt template with our real values.
        filled_in_prompt = self.rag_chain.prompt.format(
            context=context,
            question=question,
        )

        # Step 2: send the finished prompt to the AI model.
        raw_response = self.rag_chain.llm.invoke(filled_in_prompt)

        # Step 3: convert the AI's response object into a plain string.
        answer_text = self.rag_chain.output_parser.invoke(raw_response)

        return answer_text

    @staticmethod
    def _is_broad_question(question: str) -> bool:
        """
        Returns True if the question looks like it's asking for an
        overview of the whole document, rather than one specific fact.
        """

        question_lowercase = question.lower()

        for keyword in BROAD_QUESTION_KEYWORDS:
            if keyword in question_lowercase:
                return True

        return False

    @staticmethod
    def _build_source_list(chunks) -> list[Source]:
        """
        Turns a list of document chunks into a clean list of citations,
        removing duplicates (the same filename + page shouldn't show up
        twice even if multiple chunks came from that page).
        """

        sources = []
        already_added = set()

        for chunk in chunks:

            filename = chunk.metadata.get("filename", "Unknown")
            page = chunk.metadata.get("page", 0)

            citation_key = (filename, page)

            if citation_key in already_added:
                continue

            already_added.add(citation_key)

            sources.append(
                Source(
                    filename=filename,
                    page=page,
                )
            )

        return sources


chat_service = ChatService()