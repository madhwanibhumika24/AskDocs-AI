from pathlib import Path

from langchain_core.documents import Document

from app.ai.chunking.chunker import Chunker
from app.ai.loaders.loader_factory import LoaderFactory
from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory


class IngestionPipeline:

    def __init__(self) -> None:
        self.chunker = Chunker()
        self.vectorstore = VectorStoreFactory.get_vectorstore()

    def process(
        self,
        file_path: str,
        metadata: dict | None = None,
    ) -> dict:
        """
        Complete document ingestion pipeline.

        Steps:
        1. Load document
        2. Attach metadata
        3. Split into chunks
        4. Store chunks in ChromaDB
        """

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Document not found: {file_path}"
            )

        metadata = metadata or {}

        # Load document
        loader = LoaderFactory.get_loader(file_path)
        documents = loader.load(file_path)

        if not documents:
            raise ValueError(
                "No content found in the document."
            )

        # Attach metadata
        self._attach_metadata(
            documents=documents,
            metadata=metadata,
        )

        # Split document
        chunks = self.chunker.split(documents)

        if not chunks:
            raise ValueError(
                "Chunking produced no output."
            )

        # Store in vector database
        self.vectorstore.add_documents(chunks)

        return {
            "filename": path.name,
            "pages": len(documents),
            "chunks": len(chunks),
            "stored": len(chunks),
        }

    @staticmethod
    def _attach_metadata(
        documents: list[Document],
        metadata: dict,
    ) -> None:
        """
        Attach common metadata to every document.
        """

        for document in documents:
            document.metadata.update(metadata)