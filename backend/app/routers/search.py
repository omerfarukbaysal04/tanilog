from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_analysis import DoctorPrepReport
from app.models.document import Document
from app.models.health import MedicationLog, NutritionLog, SleepLog, SymptomLog
from app.models.user import User
from app.models.web_completion import RiskAlert
from app.routers.auth import get_current_user

router = APIRouter()


def _result(kind: str, title: str, description: str, created_at, route: str, is_risky: bool = False) -> dict:
    return {
        "kind": kind,
        "title": title,
        "description": description,
        "created_at": created_at,
        "route": route,
        "is_risky": is_risky,
    }


@router.get("", summary="Gelişmiş arama")
async def advanced_search(
    q: str = Query("", max_length=120),
    category: str = Query("all"),
    start_date: date | None = None,
    end_date: date | None = None,
    risky_only: bool = False,
    document_type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = q.strip()
    pattern = f"%{query}%" if query else "%"
    user_id = current_user.id
    results = []

    def in_scope(kind: str) -> bool:
        return category in ("all", kind)

    if in_scope("symptom"):
        rows = db.query(SymptomLog).filter(SymptomLog.user_id == user_id)
        if start_date:
            rows = rows.filter(SymptomLog.date >= start_date)
        if end_date:
            rows = rows.filter(SymptomLog.date <= end_date)
        rows = rows.filter(or_(SymptomLog.symptom_name.ilike(pattern), SymptomLog.notes.ilike(pattern)))
        for row in rows.order_by(SymptomLog.created_at.desc()).limit(50):
            risky = row.severity >= 8
            if risky_only and not risky:
                continue
            results.append(_result("symptom", row.symptom_name, f"Şiddet: {row.severity}/10 · {row.date}", row.created_at, "/health?tab=symptoms", risky))

    if in_scope("medication"):
        rows = db.query(MedicationLog).filter(MedicationLog.user_id == user_id)
        if start_date:
            rows = rows.filter(MedicationLog.date >= start_date)
        if end_date:
            rows = rows.filter(MedicationLog.date <= end_date)
        rows = rows.filter(or_(MedicationLog.name.ilike(pattern), MedicationLog.dosage.ilike(pattern), MedicationLog.notes.ilike(pattern)))
        for row in rows.order_by(MedicationLog.created_at.desc()).limit(50):
            risky = row.reminder_enabled and not row.is_taken
            if risky_only and not risky:
                continue
            results.append(_result("medication", row.name, f"{row.dosage} · {row.date}", row.created_at, "/health?tab=medications", risky))

    if in_scope("nutrition"):
        rows = db.query(NutritionLog).filter(NutritionLog.user_id == user_id)
        if start_date:
            rows = rows.filter(NutritionLog.date >= start_date)
        if end_date:
            rows = rows.filter(NutritionLog.date <= end_date)
        rows = rows.filter(or_(NutritionLog.meal_type.ilike(pattern), NutritionLog.notes.ilike(pattern)))
        for row in rows.order_by(NutritionLog.created_at.desc()).limit(50):
            if risky_only:
                continue
            results.append(_result("nutrition", row.meal_type, f"Beslenme kaydı · {row.date}", row.created_at, "/health?tab=nutrition"))

    if in_scope("sleep"):
        rows = db.query(SleepLog).filter(SleepLog.user_id == user_id)
        if start_date:
            rows = rows.filter(SleepLog.date >= start_date)
        if end_date:
            rows = rows.filter(SleepLog.date <= end_date)
        rows = rows.filter(or_(SleepLog.quality.ilike(pattern), SleepLog.notes.ilike(pattern)))
        for row in rows.order_by(SleepLog.created_at.desc()).limit(50):
            risky = row.hours_slept < 4
            if risky_only and not risky:
                continue
            results.append(_result("sleep", "Uyku kaydı", f"{row.hours_slept} saat · {row.date}", row.created_at, "/health?tab=sleep", risky))

    if in_scope("document"):
        rows = db.query(Document).filter(Document.user_id == user_id, Document.is_deleted.is_(False))
        if document_type:
            rows = rows.filter(Document.category == document_type)
        rows = rows.filter(or_(Document.original_filename.ilike(pattern), Document.category.ilike(pattern), Document.notes.ilike(pattern)))
        for row in rows.order_by(Document.created_at.desc()).limit(50):
            if risky_only:
                continue
            results.append(_result("document", row.original_filename, f"Belge · {row.category}", row.created_at, "/documents"))

    if in_scope("report"):
        rows = db.query(DoctorPrepReport).filter(DoctorPrepReport.user_id == user_id)
        rows = rows.filter(or_(DoctorPrepReport.title.ilike(pattern), DoctorPrepReport.summary.ilike(pattern)))
        for row in rows.order_by(DoctorPrepReport.created_at.desc()).limit(50):
            if risky_only:
                continue
            results.append(_result("report", row.title, "Doktora hazırlık raporu", row.created_at, "/doctor-prep"))

    if in_scope("risk") or risky_only:
        rows = db.query(RiskAlert).filter(RiskAlert.user_id == user_id, RiskAlert.is_dismissed.is_(False))
        rows = rows.filter(or_(RiskAlert.title.ilike(pattern), RiskAlert.message.ilike(pattern)))
        for row in rows.order_by(RiskAlert.created_at.desc()).limit(50):
            results.append(_result("risk", row.title, row.message, row.created_at, row.route or "/dashboard", True))

    results = sorted(results, key=lambda item: item["created_at"], reverse=True)[:100]
    return {"query": query, "results": results}
