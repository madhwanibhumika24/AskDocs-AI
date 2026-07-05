from langchain_core.documents import Document

from app.ai.chunking.splitter_factory import SplitterFactory


class Chunker:

    def __init__(self):
        self.splitter = SplitterFactory.get_splitter()

    def split(
        self,
        documents: list[Document],
    ) -> list[Document]:
        """
        Split LangChain Documents into smaller chunks.
        """

        return self.splitter.split_documents(documents)