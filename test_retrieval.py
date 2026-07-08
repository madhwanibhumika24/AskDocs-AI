from app.ai.vectorstores.vectorstore_factory import VectorStoreFactory

vectorstore = VectorStoreFactory.get_vectorstore()

results = vectorstore.similarity_search(
    query="What is LangChain?",
    k=3,
)

print("=" * 60)

for index, document in enumerate(results, start=1):

    print(f"Result {index}")
    print(document.page_content[:300])
    print(document.metadata)
    print("-" * 60)