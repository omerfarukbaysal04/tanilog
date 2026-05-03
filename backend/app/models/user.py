from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime

from app.database import Base


class User(Base):
    """Kullanıcı modeli."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)

    # Premium / Abonelik alanları
    subscription_plan = Column(String(20), default="free")  # free, monthly, yearly
    premium_until = Column(DateTime, nullable=True)

    # Profil
    avatar_url = Column(String(500), nullable=True)

    # Zaman damgaları
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def is_premium_active(self) -> bool:
        """Premium aboneliğin aktif olup olmadığını kontrol eder."""
        if not self.is_premium or not self.premium_until:
            return False
        return self.premium_until > datetime.utcnow()

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', plan='{self.subscription_plan}')>"
