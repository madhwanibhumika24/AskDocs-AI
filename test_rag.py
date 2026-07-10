from app.ai.chains.rag_chain import RAGChain


def main():

    rag = RAGChain()

    question = input("Ask a question: ")

    answer = rag.ask(question)

    print("\n" + "=" * 70)
    print("Answer")
    print("=" * 70)
    print(answer)


if __name__ == "__main__":
    main()