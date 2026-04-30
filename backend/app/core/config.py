"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Global application settings via .env file."""

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@db:5432/ssp_db",
        description="Async PostgreSQL connection string",
    )

    # JWT Authentication
    SECRET_KEY: str = Field(
        default="dev-secret-key-change-in-production",
        description="Secret key for JWT encoding",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=1440,
        description="JWT token expiration in minutes (default 24h)",
    )
    ALGORITHM: str = "HS256"

    # OpenRouter LLM
    OPENROUTER_API_KEY: str = Field(
        default="",
        description="API key from https://openrouter.ai/keys",
    )
    OPENROUTER_MODEL: str = Field(
        default="google/gemini-2.0-flash-exp:free",
        description="Model ID on OpenRouter (e.g. google/gemini-2.5-flash, perplexity/sonar-small-online)",
    )
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # File uploads
    UPLOAD_DIR: str = Field(default="/app/uploads", description="Local upload directory")
    MAX_UPLOAD_SIZE_MB: int = Field(default=20, description="Max file upload size in MB")

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://frontend:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
