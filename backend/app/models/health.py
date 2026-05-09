from datetime import datetime

from sqlalchemy import Boolean, Column, Integer, String, Text, Date, Time, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class SymptomLog(Base):
    """Günlük semptom kaydı."""
    __tablename__ = "symptom_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    symptom_name = Column(String(100), nullable=False)
    severity = Column(Integer, nullable=False)  # 1-10 arası
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # user = relationship("User", back_populates="symptom_logs")


class MedicationLog(Base):
    """Günlük ilaç kullanımı kaydı."""
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    dosage = Column(String(50), nullable=False)
    time_taken = Column(Time, nullable=True)
    reminder_enabled = Column(Boolean, default=False, nullable=False)
    reminder_time = Column(Time, nullable=True)
    is_taken = Column(Boolean, default=False, nullable=False)
    taken_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    image_data_url = Column(Text, nullable=True)
    ai_scan_summary = Column(Text, nullable=True)
    ai_scan_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SleepLog(Base):
    """Günlük uyku kaydı."""
    __tablename__ = "sleep_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    hours_slept = Column(Float, nullable=False)
    quality = Column(String(20), nullable=False)  # bad, fair, good, excellent
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class NutritionLog(Base):
    """Günlük beslenme ve su tüketimi kaydı."""
    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    meal_type = Column(String(20), nullable=False)  # breakfast, lunch, dinner, snack
    notes = Column(Text, nullable=False)
    water_ml = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class VoiceUsageLog(Base):
    """Daily voice assistant usage counter."""
    __tablename__ = "voice_usage_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_voice_usage_user_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
