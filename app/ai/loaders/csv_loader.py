from langchain_community.document_loaders import CSVLoader

from app.ai.loaders.base_loader import BaseLoader


class CSVLoaderWrapper(BaseLoader):

    def load(self, file_path: str):
        loader = CSVLoader(file_path=file_path)

        return loader.load()