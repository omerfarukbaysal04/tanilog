from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.database import Base


class PushSubscription(Base):
    """Web Push subscription registered by a browser."""

    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    endpoint = Column(Text, nullable=False, unique=True)
    p256dh = Column(Text, nullable=False)
    auth = Column(Text, nullable=False)
    user_agent = Column(String(500), nullable=True)
    provider = Column(String(30), default="web_push", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NotificationEvent(Base):
    """Server-side notification center event."""

    __tablename__ = "notification_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(60), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    body = Column(Text, nullable=False)
    route = Column(String(255), nullable=True)
    priority = Column(String(30), default="normal", nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class DoctorShareLink(Base):
    """Password protected temporary share link for a saved doctor report."""

    __tablename__ = "doctor_share_links"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("doctor_prep_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    view_count = Column(Integer, default=0, nullable=False)
    last_viewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RiskAlert(Base):
    """Explainable rule-based health alert."""

    __tablename__ = "risk_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_key = Column(String(80), nullable=False, index=True)
    severity = Column(String(30), default="info", nullable=False)
    title = Column(String(180), nullable=False)
    message = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    route = Column(String(255), nullable=True)
    is_dismissed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class OnboardingState(Base):
    """Tracks first-run setup completion per user."""

    __tablename__ = "onboarding_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    health_profile_done = Column(Boolean, default=False, nullable=False)
    notifications_done = Column(Boolean, default=False, nullable=False)
    first_record_done = Column(Boolean, default=False, nullable=False)
    first_document_done = Column(Boolean, default=False, nullable=False)
    ai_permissions_done = Column(Boolean, default=False, nullable=False)
    skipped = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AdminAuditLog(Base):
    """Audit trail for admin actions."""

    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(80), nullable=False, index=True)
    before = Column(Text, nullable=True)
    after = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
