import re
from datetime import date, datetime
from typing import Any, Dict

from app.services.ai_service import _json_from_gemini


def _current_time() -> str:
    return datetime.now().strftime("%H:%M")


def _extract_time(text: str) -> str | None:
    normalized = text.lower().replace(".", ":")
    match = re.search(r"\b([01]?\d|2[0-3])[: ]([0-5]\d)\b", normalized)
    if match:
        return f"{int(match.group(1)):02d}:{match.group(2)}"

    hour_match = re.search(r"\bsaat\s+([01]?\d|2[0-3])\b", normalized)
    if hour_match:
        return f"{int(hour_match.group(1)):02d}:00"

    if "sabah" in normalized:
        return "09:00"
    if "oglen" in normalized or "öğlen" in normalized:
        return "12:00"
    if "aksam" in normalized or "akşam" in normalized:
        return "20:00"
    if "gece" in normalized:
        return "22:00"
    return None


def _extract_severity(text: str) -> int:
    match = re.search(r"\b(10|[1-9])\s*(?:/10|üzerinden|siddet|şiddet|derece)?\b", text.lower())
    if match:
        return max(1, min(10, int(match.group(1))))

    lowered = text.lower()
    if any(word in lowered for word in ["cok", "çok", "siddetli", "şiddetli", "dayanilmaz", "dayanılmaz"]):
        return 8
    if any(word in lowered for word in ["hafif", "az"]):
        return 3
    if any(word in lowered for word in ["orta", "normal"]):
        return 5
    return 5


def _extract_hours(text: str) -> float:
    lowered = text.lower().replace(",", ".")
    match = re.search(r"\b(\d+(?:\.\d+)?)\s*(?:saat|hour)\b", lowered)
    if match:
        return max(0, min(24, float(match.group(1))))
    number_match = re.search(r"\b(\d+(?:\.\d+)?)\b", lowered)
    if number_match:
        return max(0, min(24, float(number_match.group(1))))
    return 7.0


def _extract_sleep_quality(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ["mukemmel", "mükemmel", "harika", "excellent", "cok iyi", "çok iyi"]):
        return "excellent"
    if any(word in lowered for word in ["kotu", "kötü", "berbat", "bad"]):
        return "bad"
    if any(word in lowered for word in ["orta", "fena degil", "fena değil", "fair"]):
        return "fair"
    return "good"


def _extract_meal_type(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ["kahvalti", "kahvaltı", "sabah"]):
        return "breakfast"
    if any(word in lowered for word in ["ogle", "öğle", "oglen", "öğlen"]):
        return "lunch"
    if any(word in lowered for word in ["aksam", "akşam"]):
        return "dinner"
    return "snack"


def _extract_water_ml(text: str) -> int:
    lowered = text.lower()
    match = re.search(r"\b(\d+)\s*(?:ml|mililitre)\b", lowered)
    if match:
        return max(0, int(match.group(1)))

    liter_match = re.search(r"\b(\d+(?:[,.]\d+)?)\s*(?:litre|lt|l)\b", lowered)
    if liter_match:
        return max(0, int(float(liter_match.group(1).replace(",", ".")) * 1000))

    if "su" in lowered:
        glass_match = re.search(r"\b(\d+)\s*(?:bardak|sise|şişe)\b", lowered)
        if glass_match:
            return int(glass_match.group(1)) * 250
    return 0


def _fallback_parse(transcript: str, target_date: date) -> Dict[str, Any]:
    lowered = transcript.lower()
    medication_keywords = ["ilaç", "ilac", "tablet", "kapsül", "kapsul", "mg", "aldım", "aldim", "içtim", "ictim"]
    medication_strong_keywords = ["ilaç", "ilac", "tablet", "kapsül", "kapsul", "mg", "mcg", "parol", "arveles"]
    symptom_keywords = ["ağrı", "agri", "baş", "bas", "mide", "bulantı", "bulanti", "ateş", "ates", "öksürük", "oksuruk", "halsiz"]
    sleep_keywords = ["uyku", "uyudum", "uyandim", "uyandım", "saat uyudum", "uykusuz"]
    nutrition_keywords = ["kahvalti", "kahvaltı", "ogle", "öğle", "oglen", "öğlen", "aksam", "akşam", "yemek", "yedim", "içtim", "ictim", "su", "beslenme"]

    has_nutrition_signal = any(keyword in lowered for keyword in nutrition_keywords)
    has_strong_medication_signal = any(keyword in lowered for keyword in medication_strong_keywords)

    if has_nutrition_signal and not has_strong_medication_signal:
        return {
            "intent": "nutrition",
            "confidence": 0.55,
            "extracted_data": {
                "date": target_date.isoformat(),
                "meal_type": _extract_meal_type(transcript),
                "water_ml": _extract_water_ml(transcript),
                "notes": transcript,
            },
            "suggested_action": "nutrition_create",
            "warnings": ["AI ayrıştırma kullanılamadı; metinden güvenli bir taslak çıkarıldı."],
        }

    if any(keyword in lowered for keyword in medication_keywords):
        cleaned = re.sub(r"\b(ilaç|ilac|aldım|aldim|içtim|ictim|kullandım|kullandim|saat|hatırlat|hatirlat)\b", " ", lowered)
        name_match = re.search(r"\b([a-zA-ZçğıöşüÇĞİÖŞÜ]{3,}(?:\s+[a-zA-ZçğıöşüÇĞİÖŞÜ]{2,})?)\b", cleaned)
        dosage_match = re.search(r"\b(\d+\s*(?:mg|ml|mcg|gr|g|tablet|kapsül|kapsul))\b", lowered)
        parsed_time = _extract_time(transcript) or _current_time()
        return {
            "intent": "medication",
            "confidence": 0.58,
            "extracted_data": {
                "date": target_date.isoformat(),
                "name": (name_match.group(1).strip().title() if name_match else "Sesli ilaç kaydı"),
                "dosage": dosage_match.group(1) if dosage_match else "Belirtilmedi",
                "time_taken": parsed_time,
                "reminder_enabled": "hatırlat" in lowered or "hatirlat" in lowered,
                "reminder_time": parsed_time if ("hatırlat" in lowered or "hatirlat" in lowered) else None,
                "notes": transcript,
            },
            "suggested_action": "medication_create",
            "warnings": ["AI ayrıştırma kullanılamadı; metinden güvenli bir taslak çıkarıldı."],
        }

    if any(keyword in lowered for keyword in sleep_keywords):
        return {
            "intent": "sleep",
            "confidence": 0.58,
            "extracted_data": {
                "date": target_date.isoformat(),
                "hours_slept": _extract_hours(transcript),
                "quality": _extract_sleep_quality(transcript),
                "notes": transcript,
            },
            "suggested_action": "sleep_create",
            "warnings": ["AI ayrıştırma kullanılamadı; metinden güvenli bir taslak çıkarıldı."],
        }

    if has_nutrition_signal:
        return {
            "intent": "nutrition",
            "confidence": 0.55,
            "extracted_data": {
                "date": target_date.isoformat(),
                "meal_type": _extract_meal_type(transcript),
                "water_ml": _extract_water_ml(transcript),
                "notes": transcript,
            },
            "suggested_action": "nutrition_create",
            "warnings": ["AI ayrıştırma kullanılamadı; metinden güvenli bir taslak çıkarıldı."],
        }

    if any(keyword in lowered for keyword in symptom_keywords):
        name_candidates = [
            ("baş ağrısı", ["baş", "bas"]),
            ("mide bulantısı", ["mide", "bulant"]),
            ("ateş", ["ateş", "ates"]),
            ("öksürük", ["öksürük", "oksuruk"]),
            ("halsizlik", ["halsiz"]),
            ("ağrı", ["ağrı", "agri"]),
        ]
        symptom_name = "Sesli semptom kaydı"
        for label, keywords in name_candidates:
            if any(keyword in lowered for keyword in keywords):
                symptom_name = label
                break

        return {
            "intent": "symptom",
            "confidence": 0.6,
            "extracted_data": {
                "date": target_date.isoformat(),
                "symptom_name": symptom_name,
                "severity": _extract_severity(transcript),
                "notes": transcript,
            },
            "suggested_action": "symptom_create",
            "warnings": ["AI ayrıştırma kullanılamadı; metinden güvenli bir taslak çıkarıldı."],
        }

    return {
        "intent": "unknown",
        "confidence": 0.25,
        "extracted_data": {"date": target_date.isoformat(), "notes": transcript},
        "suggested_action": "review",
        "warnings": ["Bu ses kaydının türü net anlaşılamadı."],
    }


def parse_voice_transcript(transcript: str, target_date: date) -> Dict[str, Any]:
    fallback = _fallback_parse(transcript, target_date)
    prompt = f"""
    Sen TanıLog içindeki Türkçe sesli sağlık asistanısın.
    Kullanıcının konuşmadan metne çevrilmiş ifadesini semptom, ilaç, uyku veya beslenme kaydı taslağına dönüştür.
    Teşhis koyma, tedavi önerme, doz tavsiye etme. Sadece kullanıcının söylediği bilgileri yapılandır.

    Hedef tarih: {target_date.isoformat()}
    Metin: {transcript}

    Sadece şu JSON formatında cevap ver:
    {{
      "intent": "symptom, medication, sleep, nutrition veya unknown",
      "confidence": 0.0 ile 1.0 arasında sayı,
      "extracted_data": {{
        "date": "{target_date.isoformat()}",
        "symptom_name": "intent symptom ise semptom adı",
        "severity": "intent symptom ise 1-10 arası sayı",
        "name": "intent medication ise ilaç adı",
        "dosage": "intent medication ise doz, yoksa Belirtilmedi",
        "time_taken": "intent medication ise HH:MM veya null",
        "reminder_enabled": "ilaç için kullanıcı hatırlatma istediyse true",
        "reminder_time": "HH:MM veya null",
        "hours_slept": "intent sleep ise 0-24 arası saat sayısı",
        "quality": "intent sleep ise bad, fair, good veya excellent",
        "meal_type": "intent nutrition ise breakfast, lunch, dinner veya snack",
        "water_ml": "intent nutrition ise su miktarı ml cinsinden sayı",
        "notes": "orijinal metinden kısa not"
      }},
      "suggested_action": "symptom_create, medication_create, sleep_create, nutrition_create veya review",
      "warnings": ["Belirsiz veya kullanıcı onayı gerektiren noktalar"]
    }}
    """

    parsed = _json_from_gemini(prompt, fallback, temperature=0.1)
    parsed.setdefault("warnings", [])
    parsed.setdefault("extracted_data", {})

    intent = parsed.get("intent", "unknown")
    if intent not in {"symptom", "medication", "sleep", "nutrition", "unknown"}:
        intent = "unknown"
        parsed["intent"] = intent

    data = parsed["extracted_data"]
    data["date"] = target_date.isoformat()

    if intent == "symptom":
        data["symptom_name"] = str(data.get("symptom_name") or "Sesli semptom kaydı")[:100]
        try:
            data["severity"] = max(1, min(10, int(data.get("severity") or 5)))
        except (TypeError, ValueError):
            data["severity"] = 5
        data["notes"] = data.get("notes") or transcript
        parsed["suggested_action"] = "symptom_create"

    if intent == "medication":
        data["name"] = str(data.get("name") or "Sesli ilaç kaydı")[:150]
        data["dosage"] = str(data.get("dosage") or "Belirtilmedi")[:50]
        data["time_taken"] = data.get("time_taken") or _current_time()
        data["reminder_enabled"] = bool(data.get("reminder_enabled", False))
        data["reminder_time"] = data.get("reminder_time") if data["reminder_enabled"] else None
        data["notes"] = data.get("notes") or transcript
        parsed["suggested_action"] = "medication_create"

    if intent == "sleep":
        try:
            data["hours_slept"] = max(0, min(24, float(data.get("hours_slept") or _extract_hours(transcript))))
        except (TypeError, ValueError):
            data["hours_slept"] = _extract_hours(transcript)
        if data.get("quality") not in {"bad", "fair", "good", "excellent"}:
            data["quality"] = _extract_sleep_quality(transcript)
        data["notes"] = data.get("notes") or transcript
        parsed["suggested_action"] = "sleep_create"

    if intent == "nutrition":
        if data.get("meal_type") not in {"breakfast", "lunch", "dinner", "snack"}:
            data["meal_type"] = _extract_meal_type(transcript)
        try:
            data["water_ml"] = max(0, int(data.get("water_ml") or _extract_water_ml(transcript)))
        except (TypeError, ValueError):
            data["water_ml"] = _extract_water_ml(transcript)
        data["notes"] = data.get("notes") or ("Sadece su" if data["water_ml"] else transcript)
        parsed["suggested_action"] = "nutrition_create"

    parsed["confidence"] = max(0, min(1, float(parsed.get("confidence") or 0)))
    return parsed
