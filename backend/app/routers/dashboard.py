from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_analysis import DoctorPrepReport
from app.models.document import Document
from app.models.health import MedicationLog, NutritionLog, SleepLog, SymptomLog
from app.models.subscription import SubscriptionEvent
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


def _activity(kind: str, title: str, description: str, created_at, route: str) -> dict:
    return {
        "kind": kind,
        "title": title,
        "description": description,
        "created_at": created_at,
        "route": route,
    }


@router.get("/summary", summary="Dashboard ozeti")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
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
        activities.append(_activity("sleep", "Uyku kaydı", f"{item.hours_slept} saat - {item.quality}", item.created_at, "/health?tab=sleep"))

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
        activities.append(_activity("billing", title, item.plan, item.completed_at or item.created_at, "/billing"))

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
    }
