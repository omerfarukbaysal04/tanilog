import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Uygulama yapılandırma ayarları."""

    # Uygulama
    APP_NAME: str = "TanıLog API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Veritabanı
    DATABASE_URL: str

    # JWT Kimlik Doğrulama
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://tanilog.onrender.com/api/v1"
    ]

    # Yapay Zeka
    GEMINI_API_KEY: str | None = None

    # Dosya depolama
    UPLOAD_DIR: str = "uploads"

    # Web Push / paylaşım linkleri
    PUBLIC_WEB_URL: str = "http://localhost:3000"
    VAPID_PUBLIC_KEY: str | None = None
    VAPID_PRIVATE_KEY: str | None = None
    VAPID_SUBJECT: str = "mailto:admin@tanilog.local"

    class Config:
        env_file = ".env"


settings = Settings()
