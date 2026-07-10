from app.ai.llm.llm_factory import LLMFactory


llm = LLMFactory.get_llm()

response = llm.invoke(
    "Say Hello in one sentence."
)

print(response.content)