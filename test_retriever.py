from app.ai.retriever.retriever_factory import RetrieverFactory


def main():

    retriever = RetrieverFactory.get_retriever()

    results = retriever.retrieve(
        query="What is LangChain?"
    )

    print("=" * 70)
    print(f"Retrieved {len(results)} document chunks")
    print("=" * 70)

    for index, document in enumerate(results, start=1):

        print(f"\nResult {index}")
        print("-" * 70)

        print(document.page_content[:300])

        print("\nMetadata")

        print(document.metadata)


if __name__ == "__main__":
    main()