from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    original_filename: str
    file_path: str
    file_type: str
    file_size: int
    category: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
