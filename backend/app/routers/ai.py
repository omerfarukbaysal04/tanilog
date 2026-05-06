from datetime import date, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_analysis import AIAnalysis
from app.models.document import Document
from app.models.health import MedicationLog, NutritionLog, SleepLog, SymptomLog
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.ai_service import (
    analyze_medication_interactions,
    analyze_symptoms_with_document,
    generate_health_report,
    scan_medications_from_file,
)

router = APIRouter()

ALLOWED_SCAN_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}
MAX_SCAN_SIZE = 5 * 1024 * 1024


class CrossAnalysisRequest(BaseModel):
    document_id: int
    days: int = Field(30, ge=7, le=60)


class HealthReportRequest(BaseModel):
    period: Literal["weekly", "monthly"] = "weekly"


class MedicationInteractionRequest(BaseModel):
    days: int = Field(30, ge=1, le=90)


def _date_or_datetime(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _serialize_items(items, fields):
    serialized = []
    for item in items:
        serialized.append({field: _date_or_datetime(getattr(item, field)) for field in fields})
    return serialized


def _health_context(db: Session, user_id: int, start_date: date, end_date: date) -> dict:
    symptoms = db.query(SymptomLog).filter(
        SymptomLog.user_id == user_id,
        SymptomLog.date >= start_date,
        SymptomLog.date <= end_date
    ).order_by(SymptomLog.date.asc()).all()

    medications = db.query(MedicationLog).filter(
        MedicationLog.user_id == user_id,
        MedicationLog.date >= start_date,
        MedicationLog.date <= end_date
    ).order_by(MedicationLog.date.asc()).all()

    sleep = db.query(SleepLog).filter(
        SleepLog.user_id == user_id,
        SleepLog.date >= start_date,
        SleepLog.date <= end_date
    ).order_by(SleepLog.date.asc()).all()

    nutrition = db.query(NutritionLog).filter(
        NutritionLog.user_id == user_id,
        NutritionLog.date >= start_date,
        NutritionLog.date <= end_date
    ).order_by(NutritionLog.date.asc()).all()

    return {
        "date_range": {"start": start_date.isoformat(), "end": end_date.isoformat()},
        "symptoms": _serialize_items(symptoms, ["date", "symptom_name", "severity", "notes"]),
        "medications": _serialize_items(medications, ["date", "name", "dosage", "time_taken", "notes"]),
        "sleep": _serialize_items(sleep, ["date", "hours_slept", "quality", "notes"]),
        "nutrition": _serialize_items(nutrition, ["date", "meal_type", "notes", "water_ml"]),
    }


def _medication_context(db: Session, user_id: int, start_date: date, end_date: date) -> dict:
    medications = db.query(MedicationLog).filter(
        MedicationLog.user_id == user_id,
        MedicationLog.date >= start_date,
        MedicationLog.date <= end_date
    ).order_by(MedicationLog.date.asc()).all()

    prescription_rows = db.query(Document, AIAnalysis).join(
        AIAnalysis,
        AIAnalysis.document_id == Document.id
    ).filter(
        Document.user_id == user_id,
        Document.is_deleted == False,
        Document.category == "recete"
    ).order_by(AIAnalysis.created_at.desc()).limit(5).all()

    return {
        "date_range": {"start": start_date.isoformat(), "end": end_date.isoformat()},
        "medications": _serialize_items(
            medications,
            ["date", "name", "dosage", "time_taken", "reminder_time", "is_taken", "notes"]
        ),
        "prescription_analyses": [
            {
                "document_id": document.id,
                "filename": document.original_filename,
                "summary": analysis.summary,
                "critical_findings": analysis.critical_findings,
                "full_analysis": analysis.full_analysis,
                "analysis_created_at": analysis.created_at,
            }
            for document, analysis in prescription_rows
        ],
    }


@router.get("/analyzed-documents")
async def list_analyzed_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rows = db.query(Document, AIAnalysis).join(
        AIAnalysis,
        AIAnalysis.document_id == Document.id
    ).filter(
        Document.user_id == current_user.id,
        Document.is_deleted == False
    ).order_by(AIAnalysis.created_at.desc()).all()

    return [
        {
            "id": document.id,
            "original_filename": document.original_filename,
            "category": document.category,
            "created_at": document.created_at,
            "analysis_created_at": analysis.created_at,
            "summary": analysis.summary,
            "has_critical_alert": analysis.has_critical_alert,
        }
        for document, analysis in rows
    ]


@router.post("/cross-analysis")
async def create_cross_analysis(
    payload: CrossAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(
        Document.id == payload.document_id,
        Document.user_id == current_user.id,
        Document.is_deleted == False
    ).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Belge bulunamadi.")

    analysis = db.query(AIAnalysis).filter(AIAnalysis.document_id == document.id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu belge henuz analiz edilmemis. Once Belgelerim sayfasindan AI analizini baslatin."
        )

    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=payload.days - 1)
    health_context = _health_context(db, current_user.id, start_date, end_date)
    document_context = {
        "document_id": document.id,
        "filename": document.original_filename,
        "category": document.category,
        "document_created_at": document.created_at,
        "analysis_created_at": analysis.created_at,
        "summary": analysis.summary,
        "critical_findings": analysis.critical_findings,
        "has_critical_alert": analysis.has_critical_alert,
        "full_analysis": analysis.full_analysis,
    }

    result = analyze_symptoms_with_document(document_context, health_context, payload.days)
    result["document"] = {
        "id": document.id,
        "original_filename": document.original_filename,
        "category": document.category,
    }
    result["days"] = payload.days
    result["date_range"] = health_context["date_range"]
    return result


@router.post("/health-report")
async def create_health_report(
    payload: HealthReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    end_date = datetime.utcnow().date()
    days = 7 if payload.period == "weekly" else 30
    start_date = end_date - timedelta(days=days - 1)
    health_context = _health_context(db, current_user.id, start_date, end_date)

    return generate_health_report(
        health_context,
        payload.period,
        start_date.isoformat(),
        end_date.isoformat()
    )


@router.post("/medication-interactions")
async def check_medication_interactions(
    payload: MedicationInteractionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="İlaç etkileşim kontrolü Premium kullanıcılar için kullanılabilir."
        )

    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=payload.days - 1)
    medication_context = _medication_context(db, current_user.id, start_date, end_date)

    result = analyze_medication_interactions(medication_context)
    result["date_range"] = medication_context["date_range"]
    return result


@router.post("/medication-scan")
async def scan_medication_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_SCAN_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sadece PDF, JPG ve PNG reçete/kutu görselleri desteklenir."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_SCAN_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dosya boyutu 5MB'ı geçemez."
        )

    result = scan_medications_from_file(file_bytes, file.content_type)
    result["source_filename"] = file.filename
    return result
