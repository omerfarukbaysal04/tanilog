from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_analysis import AIAnalysis, DoctorPrepReport
from app.models.document import Document
from app.models.family import FamilyHealthEntry
from app.models.health import MedicationLog, NutritionLog, SleepLog, SymptomLog
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()
QUALITY_LABELS = {
    "bad": "Kötü",
    "fair": "Orta",
    "good": "İyi",
    "excellent": "Mükemmel",
}
CATEGORY_LABELS = {
    "symptom": "Semptom",
    "medication": "İlaç",
    "sleep": "Uyku",
    "nutrition": "Beslenme",
    "document": "Belge",
    "ai_analysis": "AI belge analizi",
    "doctor_report": "Doktor raporu",
    "family": "Aile takibi",
}


def _item(kind: str, title: str, description: str, event_date, created_at, route: str) -> dict:
    return {
        "kind": kind,
        "title": title,
        "description": description,
        "event_date": event_date,
        "created_at": created_at,
        "route": route,
    }


@router.get("", summary="Sağlık zaman çizelgesi")
async def get_timeline(
    days: int = Query(30, ge=1, le=180),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    user_id = current_user.id
    items = []

    for row in db.query(SymptomLog).filter(SymptomLog.user_id == user_id, SymptomLog.date >= start_date).all():
        items.append(_item("symptom", row.symptom_name, f"Şiddet: {row.severity}/10", row.date, row.created_at, "/health?tab=symptoms"))
    for row in db.query(MedicationLog).filter(MedicationLog.user_id == user_id, MedicationLog.date >= start_date).all():
        status = "Alındı" if row.is_taken else "Takipte"
        items.append(_item("medication", row.name, f"{row.dosage} · {status}", row.date, row.created_at, "/health?tab=medications"))
    for row in db.query(SleepLog).filter(SleepLog.user_id == user_id, SleepLog.date >= start_date).all():
        quality = QUALITY_LABELS.get(row.quality, row.quality)
        items.append(_item("sleep", "Uyku kaydı", f"{row.hours_slept} saat · {quality}", row.date, row.created_at, "/health?tab=sleep"))
    for row in db.query(NutritionLog).filter(NutritionLog.user_id == user_id, NutritionLog.date >= start_date).all():
        items.append(_item("nutrition", "Beslenme kaydı", row.meal_type, row.date, row.created_at, "/health?tab=nutrition"))
    for row in db.query(Document).filter(Document.user_id == user_id, Document.is_deleted.is_(False), Document.created_at >= start_date).all():
        items.append(_item("document", row.original_filename, row.category, row.created_at.date(), row.created_at, "/documents"))
    for document, analysis in db.query(Document, AIAnalysis).join(AIAnalysis, AIAnalysis.document_id == Document.id).filter(
        Document.user_id == user_id,
        Document.is_deleted.is_(False),
        AIAnalysis.created_at >= start_date,
    ).all():
        items.append(_item("ai_analysis", document.original_filename, "AI belge analizi", analysis.created_at.date(), analysis.created_at, "/documents"))
    for row in db.query(DoctorPrepReport).filter(DoctorPrepReport.user_id == user_id, DoctorPrepReport.created_at >= start_date).all():
        items.append(_item("doctor_report", row.title, "Doktora hazırlık raporu", row.created_at.date(), row.created_at, "/doctor-prep"))
    for row in db.query(FamilyHealthEntry).filter(FamilyHealthEntry.user_id == user_id, FamilyHealthEntry.entry_date >= start_date).all():
        items.append(_item("family", row.title, f"Aile takibi · {CATEGORY_LABELS.get(row.category, row.category)}", row.entry_date, row.created_at, "/family"))

    items = sorted(items, key=lambda item: item["created_at"], reverse=True)
    grouped = {}
    for item in items:
        key = item["event_date"].isoformat() if hasattr(item["event_date"], "isoformat") else str(item["event_date"])
        item["kind_label"] = CATEGORY_LABELS.get(item["kind"], item["kind"])
        grouped.setdefault(key, []).append(item)

    return {
        "date_range": {"start": start_date, "end": end_date},
        "items": items[:200],
        "groups": [{"date": key, "items": value} for key, value in grouped.items()],
    }
