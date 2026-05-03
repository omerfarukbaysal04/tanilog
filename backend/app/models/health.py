from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, Date, Time, Float, ForeignKey, DateTime
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
    notes = Column(Text, nullable=True)
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
