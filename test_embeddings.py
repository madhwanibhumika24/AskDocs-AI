from app.ai.embeddings.embedding_factory import EmbeddingFactory


embeddings = EmbeddingFactory.get_embeddings()

vector = embeddings.embed_query(
    "What is LangChain?"
)

print("=" * 60)
print(f"Vector Length : {len(vector)}")
print("=" * 60)

print(vector[:10])