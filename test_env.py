from dotenv import load_dotenv
import os

load_dotenv()

print("TOP_K_RESULTS =", repr(os.getenv("TOP_K_RESULTS")))
print("EMBEDDING_MODEL =", repr(os.getenv("EMBEDDING_MODEL")))