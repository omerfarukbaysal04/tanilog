from datetime import date, time, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# --- Symptom Schemas ---
class SymptomBase(BaseModel):
    date: date
    symptom_name: str = Field(..., max_length=100)
    severity: int = Field(..., ge=1, le=10, description="1 ile 10 arasında şiddet")
    notes: Optional[str] = None


class SymptomCreate(SymptomBase):
    pass


class SymptomResponse(SymptomBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Medication Schemas ---
class MedicationBase(BaseModel):
    date: date
    name: str = Field(..., max_length=150)
    dosage: str = Field(..., max_length=50)
    time_taken: Optional[time] = None
    notes: Optional[str] = None


class MedicationCreate(MedicationBase):
    pass


class MedicationResponse(MedicationBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Sleep Schemas ---
class SleepBase(BaseModel):
    date: date
    hours_slept: float = Field(..., ge=0, le=24)
    quality: str = Field(..., pattern="^(bad|fair|good|excellent)$")
    notes: Optional[str] = None


class SleepCreate(SleepBase):
    pass


class SleepResponse(SleepBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Nutrition Schemas ---
class NutritionBase(BaseModel):
    date: date
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    notes: str
    water_ml: int = Field(0, ge=0)


class NutritionCreate(NutritionBase):
    pass


class NutritionResponse(NutritionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Daily Summary Schema ---
class DailySummaryResponse(BaseModel):
    date: date
    symptoms: List[SymptomResponse]
    medications: List[MedicationResponse]
    sleep: List[SleepResponse]
    nutrition: List[NutritionResponse]
