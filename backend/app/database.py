from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# Veritabanı bağlantı motoru
engine = create_engine(settings.DATABASE_URL)

# Oturum fabrikası
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Tüm modellerin miras alacağı temel sınıf."""
    pass


def get_db():
    """
    Veritabanı oturumu dependency injection.
    Her istek için yeni bir oturum oluşturur ve istek sonunda kapatır.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
