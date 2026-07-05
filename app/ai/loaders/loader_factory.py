from pathlib import Path

from app.ai.loaders.pdf_loader import PDFLoader
from app.ai.loaders.docx_loader import DOCXLoader
from app.ai.loaders.txt_loader import TXTLoader
from app.ai.loaders.csv_loader import CSVLoaderWrapper


class LoaderFactory:

    LOADERS = {
        ".pdf": PDFLoader,
        ".docx": DOCXLoader,
        ".txt": TXTLoader,
        ".md": TXTLoader,
        ".csv": CSVLoaderWrapper,
    }

    @classmethod
    def get_loader(cls, file_path: str):

        extension = Path(file_path).suffix.lower()

        loader = cls.LOADERS.get(extension)

        if loader is None:
            raise ValueError(
                f"Unsupported file type: {extension}"
            )

        return loader()