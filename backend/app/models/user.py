from datetime import datetime

from sqlalchemy import Column, Float, Integer, String, Boolean, DateTime, Text

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
    is_admin = Column(Boolean, default=False, nullable=False)

    # Premium / Abonelik alanları
    subscription_plan = Column(String(20), default="free")  # free, monthly, yearly
    premium_until = Column(DateTime, nullable=True)

    # Profil
    avatar_url = Column(String(500), nullable=True)

    # Yasal onaylar
    terms_accepted_at = Column(DateTime, nullable=True)
    privacy_accepted_at = Column(DateTime, nullable=True)

    # Uygulama ayarlari
    notifications_enabled = Column(Boolean, default=True, nullable=False)
    voice_notifications_enabled = Column(Boolean, default=False, nullable=False)
    medication_reminders_enabled = Column(Boolean, default=True, nullable=False)
    family_invite_notifications_enabled = Column(Boolean, default=True, nullable=False)
    quiet_hours_enabled = Column(Boolean, default=False, nullable=False)
    quiet_hours_start = Column(String(5), nullable=True)
    quiet_hours_end = Column(String(5), nullable=True)

    # AI veri izinleri
    ai_use_health_records = Column(Boolean, default=True, nullable=False)
    ai_use_documents = Column(Boolean, default=True, nullable=False)
    ai_use_doctor_reports = Column(Boolean, default=True, nullable=False)
    ai_use_profile = Column(Boolean, default=True, nullable=False)

    # Saglik profili
    birth_year = Column(Integer, nullable=True)
    biological_sex = Column(String(30), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    blood_type = Column(String(10), nullable=True)
    chronic_conditions = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)

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
