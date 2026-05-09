from datetime import date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class VoiceUsageResponse(BaseModel):
    limit: int
    used_today: int
    remaining: Optional[int]
    is_premium: bool


class VoiceParseRequest(BaseModel):
    transcript: str = Field(..., min_length=3, max_length=1000)
    target_date: Optional[date] = None


class VoiceParseResponse(BaseModel):
    transcript: str
    intent: str
    confidence: float = Field(0, ge=0, le=1)
    extracted_data: Dict[str, Any]
    suggested_action: str
    warnings: List[str] = []
    usage: VoiceUsageResponse
