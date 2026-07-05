from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings


class SplitterFactory:

    @staticmethod
    def get_splitter() -> RecursiveCharacterTextSplitter:
        """
        Create and return the application's default text splitter.
        """

        return RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            add_start_index=True,
        )