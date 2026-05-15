import logging

from app.config import settings

logger = logging.getLogger("tanilog.security")

DEFAULT_SECRET_VALUES = {
    "change-this-to-a-random-secret-key-in-production",
    "secret",
    "changeme",
}


def validate_runtime_security() -> None:
    """Fail fast for unsafe production configuration."""
    problems: list[str] = []

    if not settings.DEBUG:
        if settings.SECRET_KEY in DEFAULT_SECRET_VALUES or len(settings.SECRET_KEY) < 32:
            problems.append("SECRET_KEY production icin guclu ve en az 32 karakter olmali.")
        if "*" in settings.ALLOWED_ORIGINS:
            problems.append("ALLOWED_ORIGINS production ortaminda '*' olamaz.")
        if settings.DATABASE_URL.startswith("sqlite"):
            problems.append("Production ortaminda SQLite kullanilmamali.")

    if problems:
        raise RuntimeError("Production guvenlik kontrolu basarisiz: " + " ".join(problems))

    if settings.DEBUG:
        logger.info("DEBUG=true; production guvenlik kontrolleri uyari modunda.")
