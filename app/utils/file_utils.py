import shutil
from pathlib import Path


def create_directory(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def delete_directory(path: Path):
    """
    Recursively removes a directory and everything in it.
    Safe to call even if the path doesn't exist.
    """
    if path.exists():
        shutil.rmtree(path)