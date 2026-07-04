import json
from pathlib import Path
from datetime import datetime


def create_metadata(
    metadata_path: Path,
    document_id: str,
    user_id: str,
    filename: str,
    file_size: int,
):
    metadata = {
        "document_id": document_id,
        "user_id": user_id,
        "filename": filename,
        "file_type": Path(filename).suffix.lower().replace(".", ""),
        "size": file_size,
        "status": "uploaded",
        "created_at": datetime.utcnow().isoformat(),
    }

    with open(metadata_path, "w") as file:
        json.dump(metadata, file, indent=4)