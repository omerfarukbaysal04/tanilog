from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.health import SymptomLog, MedicationLog, SleepLog, NutritionLog
from app.schemas.health import (
    SymptomCreate, SymptomResponse,
    MedicationCreate, MedicationResponse,
    SleepCreate, SleepResponse,
    NutritionCreate, NutritionResponse,
    DailySummaryResponse
)
from app.routers.auth import get_current_user

router = APIRouter()

# --- Semptomlar ---

@router.post("/symptoms", response_model=SymptomResponse, status_code=status.HTTP_201_CREATED)
async def create_symptom(
    data: SymptomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = SymptomLog(**data.model_dump(), user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/symptoms", response_model=List[SymptomResponse])
async def get_symptoms(
    target_date: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SymptomLog).filter(SymptomLog.user_id == current_user.id)
    if target_date:
        query = query.filter(SymptomLog.date == target_date)
    return query.order_by(SymptomLog.created_at.desc()).all()

@router.delete("/symptoms/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_symptom(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(SymptomLog).filter(SymptomLog.id == item_id, SymptomLog.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    db.delete(db_item)
    db.commit()


# --- İlaçlar ---

@router.post("/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(
    data: MedicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = MedicationLog(**data.model_dump(), user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/medications", response_model=List[MedicationResponse])
async def get_medications(
    target_date: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(MedicationLog).filter(MedicationLog.user_id == current_user.id)
    if target_date:
        query = query.filter(MedicationLog.date == target_date)
    return query.order_by(MedicationLog.created_at.desc()).all()

@router.delete("/medications/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(MedicationLog).filter(MedicationLog.id == item_id, MedicationLog.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    db.delete(db_item)
    db.commit()


# --- Uyku ---

@router.post("/sleep", response_model=SleepResponse, status_code=status.HTTP_201_CREATED)
async def create_sleep(
    data: SleepCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Bir günde sadece bir uyku kaydı olmasına izin ver
    existing = db.query(SleepLog).filter(SleepLog.user_id == current_user.id, SleepLog.date == data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu tarih için zaten bir uyku kaydı mevcut.")

    db_item = SleepLog(**data.model_dump(), user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/sleep", response_model=List[SleepResponse])
async def get_sleeps(
    target_date: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SleepLog).filter(SleepLog.user_id == current_user.id)
    if target_date:
        query = query.filter(SleepLog.date == target_date)
    return query.order_by(SleepLog.created_at.desc()).all()

@router.delete("/sleep/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sleep(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(SleepLog).filter(SleepLog.id == item_id, SleepLog.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    db.delete(db_item)
    db.commit()


# --- Beslenme ---

@router.post("/nutrition", response_model=NutritionResponse, status_code=status.HTTP_201_CREATED)
async def create_nutrition(
    data: NutritionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = NutritionLog(**data.model_dump(), user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/nutrition", response_model=List[NutritionResponse])
async def get_nutritions(
    target_date: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(NutritionLog).filter(NutritionLog.user_id == current_user.id)
    if target_date:
        query = query.filter(NutritionLog.date == target_date)
    return query.order_by(NutritionLog.created_at.desc()).all()

@router.delete("/nutrition/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_nutrition(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(NutritionLog).filter(NutritionLog.id == item_id, NutritionLog.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    db.delete(db_item)
    db.commit()


# --- Günlük Özet ---

@router.get("/daily-summary", response_model=DailySummaryResponse)
async def get_daily_summary(
    date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    symptoms = db.query(SymptomLog).filter(SymptomLog.user_id == current_user.id, SymptomLog.date == date).all()
    medications = db.query(MedicationLog).filter(MedicationLog.user_id == current_user.id, MedicationLog.date == date).all()
    sleeps = db.query(SleepLog).filter(SleepLog.user_id == current_user.id, SleepLog.date == date).all()
    nutritions = db.query(NutritionLog).filter(NutritionLog.user_id == current_user.id, NutritionLog.date == date).all()

    return {
        "date": date,
        "symptoms": symptoms,
        "medications": medications,
        "sleep": sleeps,
        "nutrition": nutritions
    }
