"""Application configuration loaded from environment variables."""

import logging
from pydantic_settings import BaseSettings
from pydantic import Field, model_validator

logger = logging.getLogger(__name__)


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
        default="google/gemma-3-27b-it:free",
        description="Model ID on OpenRouter",
    )
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # AI timeout (seconds)
    OPENAI_TIMEOUT: int = Field(
        default=60,
        description="Seconds before an AI request times out",
    )

    # File uploads
    UPLOAD_DIR: str = Field(default="/app/uploads", description="Local upload directory")
    MAX_UPLOAD_SIZE_MB: int = Field(default=20, description="Max file upload size in MB")

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://frontend:3000",
    ]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @model_validator(mode="after")
    def _validate_critical_settings(self) -> "Settings":
        if not self.SECRET_KEY or self.SECRET_KEY.strip() == "":
            raise ValueError(
                "SECRET_KEY must not be empty. "
                "Generate one with: python3 -c \"import secrets; print(secrets.token_hex(32))\""
            )
        if self.OPENROUTER_API_KEY in ("", "your-openrouter-api-key-here"):
            logger.warning(
                "⚠️  OPENROUTER_API_KEY is not configured. "
                "AI features will return errors. Get a free key at https://openrouter.ai/keys"
            )
        return self


settings = Settings()
