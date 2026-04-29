import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Uygulama yapılandırma ayarları."""

    # Uygulama
    APP_NAME: str = "TanıLog API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Veritabanı
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://tanilog_user:tanilog_secret_2026@db:5432/tanilog"
    )

    # JWT Kimlik Doğrulama
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    class Config:
        env_file = ".env"


settings = Settings()
