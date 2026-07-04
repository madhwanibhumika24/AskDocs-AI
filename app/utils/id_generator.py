import uuid


def generate_document_id() -> str:
    return f"doc_{uuid.uuid4().hex[:8]}"