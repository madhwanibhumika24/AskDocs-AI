import time
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

        print(f"\n[ingestion] ---- Starting: {path.name} ----")

        # ---- Step 1: Load the file ----
        print(f"[ingestion] Loading file...")

        loader = LoaderFactory.get_loader(file_path)
        documents = loader.load(file_path)

        print(f"[ingestion] Loaded {len(documents)} page(s)/section(s).")

        for document in documents:
            document.metadata.update(metadata)

        # ---- Step 2: Split into chunks ----
        print(f"[ingestion] Splitting into chunks...")

        chunk_start_time = time.time()
        chunks = self.chunker.split(documents)
        chunk_seconds = time.time() - chunk_start_time

        print(f"[ingestion] Created {len(chunks)} chunk(s) in {chunk_seconds:.2f}s.")

        # Show a short preview of the first chunk, just so you can see
        # what's actually being fed into the AI — the first 120
        # characters is usually enough to sanity-check it looks right.
        if chunks:
            preview = chunks[0].page_content[:120].replace("\n", " ")
            print(f"[ingestion] First chunk preview: \"{preview}...\"")

        # ---- Step 3: Generate embeddings and store in ChromaDB ----
        print(f"[ingestion] Generating embeddings and storing in ChromaDB...")

        embed_start_time = time.time()
        self.vectorstore.add_documents(chunks)
        embed_seconds = time.time() - embed_start_time

        print(f"[ingestion] Stored {len(chunks)} chunk(s) in {embed_seconds:.2f}s.")
        print(f"[ingestion] ---- Done: {path.name} ----\n")

        return {
            "filename": path.name,
            "pages": len(documents),
            "chunks": len(chunks),
            "stored": len(chunks),
        }