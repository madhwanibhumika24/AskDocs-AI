from pathlib import Path

from app.core.constants import SUPPORTED_FILE_TYPES


def validate_file_type(filename: str) -> bool:
    extension = Path(filename).suffix.lower()
    return extension in SUPPORTED_FILE_TYPES