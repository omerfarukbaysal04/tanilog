from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String

from app.database import Base


class SubscriptionEvent(Base):
    """Payment and subscription audit trail for premium plan changes."""

    __tablename__ = "subscription_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    plan = Column(String(20), nullable=False)
    provider = Column(String(50), default="mock", nullable=False)
    provider_session_id = Column(String(120), nullable=True, index=True)
    amount = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(10), default="TRY", nullable=False)
    status = Column(String(30), default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
