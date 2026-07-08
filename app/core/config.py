from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    APP_NAME: str

    APP_VERSION: str

    GEMINI_API_KEY: str = ""

    UPLOAD_DIRECTORY: str

    CHROMA_DIRECTORY: str

    CHUNK_SIZE: int

    CHUNK_OVERLAP: int

    TOP_K_RESULTS: int

    EMBEDDING_MODEL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()