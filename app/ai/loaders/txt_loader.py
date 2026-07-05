from langchain_community.document_loaders import TextLoader

from app.ai.loaders.base_loader import BaseLoader


class TXTLoader(BaseLoader):

    def load(self, file_path: str):
        loader = TextLoader(
            file_path=file_path,
            encoding="utf-8"
        )

        return loader.load()