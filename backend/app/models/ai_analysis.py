from datetime import datetime

from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship

from app.database import Base


class AIAnalysis(Base):
    """Yapay Zeka Analiz Sonucu Modeli"""
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    summary = Column(Text, nullable=False)
    critical_findings = Column(Text, nullable=True)
    full_analysis = Column(Text, nullable=False)
    
    has_critical_alert = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    document = relationship("Document", backref="ai_analysis")
