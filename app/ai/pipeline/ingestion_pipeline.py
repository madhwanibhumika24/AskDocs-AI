from pathlib import Path

from app.ai.chunking.chunker import Chunker
from app.ai.loaders.loader_factory import LoaderFactory
from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory


class IngestionPipeline:

    def __init__(self):

        self.chunker = Chunker()
        self.vectorstore = VectorStoreFactory.get_vectorstore()

    def process(
        self,
        file_path: str,
        metadata: dict | None = None,
    ) -> dict:

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"{file_path} does not exist.")

        metadata = metadata or {}

        loader = LoaderFactory.get_loader(file_path)

        documents = loader.load(file_path)

        for document in documents:
            document.metadata.update(metadata)

        chunks = self.chunker.split(documents)

        self.vectorstore.add_documents(chunks)

        return {
            "filename": path.name,
            "pages": len(documents),
            "chunks": len(chunks),
            "stored": len(chunks),
        }