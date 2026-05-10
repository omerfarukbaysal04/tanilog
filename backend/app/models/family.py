from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class FamilyMember(Base):
    """Premium kullanıcının uzaktan takip ettiği aile üyesi profili."""

    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    linked_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    full_name = Column(String(255), nullable=False)
    relation = Column(String(80), nullable=False)
    birth_year = Column(Integer, nullable=True)
    phone = Column(String(40), nullable=True)
    emergency_contact = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entries = relationship("FamilyHealthEntry", back_populates="member", cascade="all, delete-orphan")


class FamilyHealthEntry(Base):
    """Aile üyesi için hızlı sağlık takip kaydı."""

    __tablename__ = "family_health_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_date = Column(Date, nullable=False, index=True)
    category = Column(String(40), nullable=False)
    title = Column(String(180), nullable=False)
    severity = Column(Integer, nullable=True)
    status = Column(String(40), default="note", nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("FamilyMember", back_populates="entries")


class FamilyInvitation(Base):
    """Aile takibi için gerçek TanıLog kullanıcısına gönderilen davet."""

    __tablename__ = "family_invitations"

    id = Column(Integer, primary_key=True, index=True)
    inviter_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id", ondelete="SET NULL"), nullable=True, index=True)
    invitee_email = Column(String(255), nullable=False, index=True)
    relation = Column(String(80), nullable=False)
    token = Column(String(80), unique=True, nullable=False, index=True)
    status = Column(String(30), default="pending", nullable=False, index=True)
    can_view_documents = Column(Boolean, default=True, nullable=False)
    can_add_records = Column(Boolean, default=False, nullable=False)
    can_edit_records = Column(Boolean, default=False, nullable=False)
    message = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FamilyAccess(Base):
    """Kabul edilmiş aile takibi erişimi."""

    __tablename__ = "family_accesses"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    watcher_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    invitation_id = Column(Integer, ForeignKey("family_invitations.id", ondelete="SET NULL"), nullable=True, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id", ondelete="SET NULL"), nullable=True, index=True)
    relation = Column(String(80), nullable=False)
    can_view_documents = Column(Boolean, default=True, nullable=False)
    can_add_records = Column(Boolean, default=False, nullable=False)
    can_edit_records = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
