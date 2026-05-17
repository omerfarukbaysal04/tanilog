import json
import re
from collections import Counter, defaultdict
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.health import MedicationLog, SleepLog, SymptomLog


def _alert(rule_key: str, severity: str, title: str, message: str, evidence: dict, route: str) -> dict:
    return {
        "rule_key": rule_key,
        "severity": severity,
        "title": title,
        "message": message,
        "evidence": json.dumps(evidence, ensure_ascii=False, default=str),
        "route": route,
    }


def evaluate_user_risks(db: Session, user_id: int, today: date | None = None) -> list[dict]:
    today = today or date.today()
    start = today - timedelta(days=6)
    alerts: list[dict] = []

    symptoms = db.query(SymptomLog).filter(
        SymptomLog.user_id == user_id,
        SymptomLog.date >= start,
        SymptomLog.date <= today,
    ).all()
    severe_by_name = defaultdict(list)
    for item in symptoms:
        if item.severity >= 8:
            severe_by_name[item.symptom_name.lower().strip()].append(item)
    for name, items in severe_by_name.items():
        recent_dates = {item.date for item in items if item.date >= today - timedelta(days=2)}
        if len(recent_dates) >= 3:
            alerts.append(_alert(
                "severe_symptom_3_days",
                "warning",
                "Tekrarlayan yüksek şiddetli semptom",
                f"{items[0].symptom_name} son 3 gün içinde 8+ şiddetle tekrar etmiş. Bu bir teşhis değildir; devam ederse doktorla görüşmek iyi olur.",
                {"symptom": items[0].symptom_name, "dates": sorted(recent_dates)},
                "/health?tab=symptoms",
            ))

    medications = db.query(MedicationLog).filter(
        MedicationLog.user_id == user_id,
        MedicationLog.date >= start,
        MedicationLog.date <= today,
    ).all()
    skipped = [item for item in medications if item.reminder_enabled and not item.is_taken]
    skipped_counter = Counter(item.name.lower().strip() for item in skipped)
    for name, count in skipped_counter.items():
        if count >= 2:
            sample = next(item for item in skipped if item.name.lower().strip() == name)
            alerts.append(_alert(
                "medication_skipped_twice",
                "warning",
                "İlaç alımı birkaç kez atlanmış",
                f"{sample.name} için son günlerde {count} kez alınmadı kaydı görünüyor. Kullanım planını doktorun veya eczacınla netleştir.",
                {"medication": sample.name, "count": count},
                "/health?tab=medications",
            ))

    per_day_med = defaultdict(list)
    suspicious_dose_pattern = re.compile(r"(\d{4,}|[^\w\sçğıöşüÇĞİÖŞÜ/.,+-])", re.IGNORECASE)
    for item in medications:
        key = (item.date, item.name.lower().strip(), item.dosage.lower().strip())
        per_day_med[key].append(item)
        if suspicious_dose_pattern.search(item.dosage or ""):
            alerts.append(_alert(
                "suspicious_dosage",
                "info",
                "Doz bilgisi kontrol edilmeli",
                f"{item.name} için doz alanı alışılmışın dışında görünüyor: {item.dosage}. Yazım hatası olabilir.",
                {"medication": item.name, "dosage": item.dosage, "date": item.date},
                "/health?tab=medications",
            ))
    for (entry_date, name, dosage), items in per_day_med.items():
        if len(items) >= 2:
            alerts.append(_alert(
                "duplicate_medication_same_day",
                "info",
                "Aynı ilaç aynı gün tekrar eklenmiş",
                f"{items[0].name} ({items[0].dosage}) {entry_date} tarihinde birden fazla kez kayıtlı.",
                {"medication": items[0].name, "dosage": dosage, "date": entry_date, "count": len(items)},
                "/health?tab=medications",
            ))

    sleep_logs = db.query(SleepLog).filter(
        SleepLog.user_id == user_id,
        SleepLog.date >= today - timedelta(days=2),
        SleepLog.date <= today,
    ).all()
    low_sleep = [item for item in sleep_logs if item.hours_slept < 4]
    if low_sleep:
        alerts.append(_alert(
            "low_sleep_under_4h",
            "info",
            "Uyku süresi çok düşük",
            "Son 3 gün içinde 4 saatin altında uyku kaydı var. Bu durum tekrar ederse günlük enerji ve semptomlarla birlikte takip et.",
            {"dates": [item.date for item in low_sleep], "hours": [item.hours_slept for item in low_sleep]},
            "/health?tab=sleep",
        ))

    return alerts
