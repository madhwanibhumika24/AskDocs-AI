from pathlib import Path

from app.ai.chunking.chunker import Chunker
from app.ai.loaders.loader_factory import LoaderFactory
from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory


pdf = next(
    Path("app/storage/users/guest/documents").rglob("*.pdf")
)

loader = LoaderFactory.get_loader(str(pdf))

documents = loader.load(str(pdf))

chunker = Chunker()

chunks = chunker.split(documents)

vectorstore = VectorStoreFactory.get_vectorstore()

vectorstore.add_documents(chunks)

print("=" * 60)
print(f"Stored {len(chunks)} chunks successfully.")
print("=" * 60)