from pathlib import Path

from app.ai.loaders.loader_factory import LoaderFactory


document_path = Path(
    "app/storage/users/guest/documents"
)

# Replace with your uploaded document folder
document = next(document_path.rglob("*.pdf"))

loader = LoaderFactory.get_loader(str(document))

documents = loader.load(str(document))

print("=" * 80)
print(f"Loaded Pages : {len(documents)}")
print("=" * 80)

print(documents[0].page_content[:500])