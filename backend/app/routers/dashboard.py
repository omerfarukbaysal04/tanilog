from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_analysis import DoctorPrepReport
from app.models.document import Document
from app.models.health import MedicationLog, NutritionLog, SleepLog, SymptomLog
from app.models.subscription import SubscriptionEvent
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()
ISTANBUL_TZ = ZoneInfo("Europe/Istanbul")
QUALITY_LABELS = {
    "bad": "Kötü",
    "fair": "Orta",
    "good": "İyi",
    "excellent": "Mükemmel",
}
PLAN_LABELS = {
    "free": "Ücretsiz",
    "monthly": "Premium Aylık",
    "yearly": "Premium Yıllık",
}


def _activity(kind: str, title: str, description: str, created_at, route: str) -> dict:
    return {
        "kind": kind,
        "title": title,
        "description": description,
        "created_at": created_at,
        "route": route,
    }


@router.get("/summary", summary="Dashboard özeti")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = datetime.now(ISTANBUL_TZ).date()
    user_id = current_user.id

    symptom_count = db.query(func.count(SymptomLog.id)).filter(SymptomLog.user_id == user_id).scalar() or 0
    medication_count = db.query(func.count(MedicationLog.id)).filter(MedicationLog.user_id == user_id).scalar() or 0
    sleep_count = db.query(func.count(SleepLog.id)).filter(SleepLog.user_id == user_id).scalar() or 0
    nutrition_count = db.query(func.count(NutritionLog.id)).filter(NutritionLog.user_id == user_id).scalar() or 0
    document_count = (
        db.query(func.count(Document.id))
        .filter(Document.user_id == user_id, Document.is_deleted.is_(False))
        .scalar()
        or 0
    )
    report_count = db.query(func.count(DoctorPrepReport.id)).filter(DoctorPrepReport.user_id == user_id).scalar() or 0

    today_symptoms = db.query(SymptomLog).filter(SymptomLog.user_id == user_id, SymptomLog.date == today).all()
    today_medications = db.query(MedicationLog).filter(MedicationLog.user_id == user_id, MedicationLog.date == today).all()
    today_sleep = db.query(SleepLog).filter(SleepLog.user_id == user_id, SleepLog.date == today).all()
    today_nutrition = db.query(NutritionLog).filter(NutritionLog.user_id == user_id, NutritionLog.date == today).all()

    activities = []
    for item in db.query(SymptomLog).filter(SymptomLog.user_id == user_id).order_by(SymptomLog.created_at.desc()).limit(5):
        activities.append(_activity("symptom", item.symptom_name, f"Şiddet: {item.severity}/10", item.created_at, "/health?tab=symptoms"))

    for item in db.query(MedicationLog).filter(MedicationLog.user_id == user_id).order_by(MedicationLog.created_at.desc()).limit(5):
        status = "Alındı" if item.is_taken else "Takipte"
        activities.append(_activity("medication", item.name, f"{item.dosage} - {status}", item.created_at, "/health?tab=medications"))

    for item in db.query(SleepLog).filter(SleepLog.user_id == user_id).order_by(SleepLog.created_at.desc()).limit(3):
        quality = QUALITY_LABELS.get(item.quality, item.quality)
        activities.append(_activity("sleep", "Uyku kaydı", f"{item.hours_slept} saat - {quality}", item.created_at, "/health?tab=sleep"))

    for item in db.query(NutritionLog).filter(NutritionLog.user_id == user_id).order_by(NutritionLog.created_at.desc()).limit(3):
        activities.append(_activity("nutrition", "Beslenme kaydı", item.meal_type, item.created_at, "/health?tab=nutrition"))

    for item in (
        db.query(Document)
        .filter(Document.user_id == user_id, Document.is_deleted.is_(False))
        .order_by(Document.created_at.desc())
        .limit(5)
    ):
        activities.append(_activity("document", item.original_filename, item.category, item.created_at, "/documents"))

    for item in db.query(DoctorPrepReport).filter(DoctorPrepReport.user_id == user_id).order_by(DoctorPrepReport.created_at.desc()).limit(3):
        activities.append(_activity("report", item.title, "Doktor raporu kaydedildi", item.created_at, "/doctor-prep"))

    for item in (
        db.query(SubscriptionEvent)
        .filter(SubscriptionEvent.user_id == user_id, SubscriptionEvent.status == "completed")
        .order_by(SubscriptionEvent.completed_at.desc().nullslast(), SubscriptionEvent.created_at.desc())
        .limit(3)
    ):
        title = "Premium abonelik" if item.event_type != "subscription_cancelled" else "Abonelik iptali"
        activities.append(_activity("billing", title, PLAN_LABELS.get(item.plan, item.plan), item.completed_at or item.created_at, "/billing"))

    activities = sorted(
        [activity for activity in activities if activity["created_at"]],
        key=lambda activity: activity["created_at"],
        reverse=True,
    )[:8]

    trends = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        trends.append({
            "date": day,
            "symptoms": len([item for item in db.query(SymptomLog).filter(SymptomLog.user_id == user_id, SymptomLog.date == day).all()]),
            "medications": len([item for item in db.query(MedicationLog).filter(MedicationLog.user_id == user_id, MedicationLog.date == day).all()]),
            "sleep": len([item for item in db.query(SleepLog).filter(SleepLog.user_id == user_id, SleepLog.date == day).all()]),
            "nutrition": len([item for item in db.query(NutritionLog).filter(NutritionLog.user_id == user_id, NutritionLog.date == day).all()]),
        })

    data_quality = []
    if len(today_symptoms) == 0:
        data_quality.append({
            "kind": "symptom",
            "title": "Bugün semptom kaydı yok",
            "description": "Kendini iyi hissetsen bile kısa bir not, AI raporlarının doğruluğunu artırır.",
            "route": "/health?tab=symptoms&new=1",
        })
    if len(today_medications) > 0 and any(not item.is_taken for item in today_medications):
        data_quality.append({
            "kind": "medication",
            "title": "Takipte ilaç var",
            "description": "Bugünkü ilaç kayıtlarında alınmadı olarak görünen öğeler var.",
            "route": "/health?tab=medications",
        })
    if len(today_sleep) == 0:
        data_quality.append({
            "kind": "sleep",
            "title": "Uyku kaydı eksik",
            "description": "Uyku bilgisi haftalık trend ve doktor raporlarında önemli bir bağlam sağlar.",
            "route": "/health?tab=sleep&new=1",
        })
    if document_count == 0:
        data_quality.append({
            "kind": "document",
            "title": "Henüz belge yok",
            "description": "Tahlil, reçete veya rapor yükleyerek AI analizlerini zenginleştirebilirsin.",
            "route": "/documents",
        })

    return {
        "counts": {
            "symptoms": symptom_count,
            "medications": medication_count,
            "sleep": sleep_count,
            "nutrition": nutrition_count,
            "documents": document_count,
            "doctor_reports": report_count,
            "total_records": symptom_count + medication_count + sleep_count + nutrition_count + document_count + report_count,
        },
        "today": {
            "symptoms": len(today_symptoms),
            "medications": len(today_medications),
            "medications_taken": len([item for item in today_medications if item.is_taken]),
            "sleep": len(today_sleep),
            "nutrition": len(today_nutrition),
        },
        "trends": trends,
        "latest_activity_at": activities[0]["created_at"] if activities else None,
        "activities": activities,
        "data_quality": data_quality[:4],
    }


@router.get("/search", summary="Kullanıcı verilerinde arama")
async def search_dashboard(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = q.strip()
    if len(query) < 2:
        return {"query": query, "results": []}

    pattern = f"%{query}%"
    user_id = current_user.id
    results = []

    def add_result(kind: str, title: str, description: str, created_at, route: str) -> None:
        results.append({
            "kind": kind,
            "title": title,
            "description": description,
            "created_at": created_at,
            "route": route,
        })

    for item in (
        db.query(SymptomLog)
        .filter(
            SymptomLog.user_id == user_id,
            or_(SymptomLog.symptom_name.ilike(pattern), SymptomLog.notes.ilike(pattern)),
        )
        .order_by(SymptomLog.created_at.desc())
        .limit(5)
    ):
        add_result("symptom", item.symptom_name, f"Semptom kaydı · {item.date}", item.created_at, "/health?tab=symptoms")

    for item in (
        db.query(MedicationLog)
        .filter(
            MedicationLog.user_id == user_id,
            or_(MedicationLog.name.ilike(pattern), MedicationLog.dosage.ilike(pattern), MedicationLog.notes.ilike(pattern)),
        )
        .order_by(MedicationLog.created_at.desc())
        .limit(5)
    ):
        add_result("medication", item.name, f"{item.dosage} · {item.date}", item.created_at, "/health?tab=medications")

    for item in (
        db.query(NutritionLog)
        .filter(
            NutritionLog.user_id == user_id,
            or_(NutritionLog.meal_type.ilike(pattern), NutritionLog.notes.ilike(pattern)),
        )
        .order_by(NutritionLog.created_at.desc())
        .limit(5)
    ):
        add_result("nutrition", item.meal_type, f"Beslenme kaydı · {item.date}", item.created_at, "/health?tab=nutrition")

    for item in (
        db.query(Document)
        .filter(
            Document.user_id == user_id,
            Document.is_deleted.is_(False),
            or_(Document.original_filename.ilike(pattern), Document.category.ilike(pattern), Document.notes.ilike(pattern)),
        )
        .order_by(Document.created_at.desc())
        .limit(5)
    ):
        add_result("document", item.original_filename, f"Belge · {item.category}", item.created_at, "/documents")

    for item in (
        db.query(DoctorPrepReport)
        .filter(
            DoctorPrepReport.user_id == user_id,
            or_(DoctorPrepReport.title.ilike(pattern), DoctorPrepReport.summary.ilike(pattern)),
        )
        .order_by(DoctorPrepReport.created_at.desc())
        .limit(5)
    ):
        add_result("report", item.title, "Doktora hazırlık raporu", item.created_at, "/doctor-prep")

    results = sorted(
        [item for item in results if item["created_at"]],
        key=lambda item: item["created_at"],
        reverse=True,
    )[:10]
    return {"query": query, "results": results}
