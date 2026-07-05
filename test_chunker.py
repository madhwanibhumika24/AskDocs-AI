from pathlib import Path

from app.ai.chunking.chunker import Chunker
from app.ai.loaders.loader_factory import LoaderFactory


document = next(
    Path("app/storage/users/guest/documents").rglob("*.pdf")
)

loader = LoaderFactory.get_loader(str(document))

documents = loader.load(str(document))

chunker = Chunker()

chunks = chunker.split(documents)

print("=" * 60)
print(f"Pages Loaded : {len(documents)}")
print(f"Chunks Created : {len(chunks)}")
print("=" * 60)

print(chunks[0].page_content[:500])

print("\nMetadata:")
print(chunks[0].metadata)