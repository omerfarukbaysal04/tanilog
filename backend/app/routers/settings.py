from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_analysis import AIAnalysis, DoctorPrepReport
from app.models.chat import ChatMessage, ChatSession
from app.models.document import Document
from app.models.family import FamilyAccess, FamilyHealthEntry, FamilyInvitation, FamilyMember
from app.models.health import MedicationLog, NutritionLog, SleepLog, SymptomLog, VoiceUsageLog
from app.models.subscription import SubscriptionEvent
from app.models.user import User
from app.routers.auth import get_current_user, verify_password

router = APIRouter()


class NotificationSettings(BaseModel):
    notifications_enabled: bool = True
    voice_notifications_enabled: bool = False
    medication_reminders_enabled: bool = True
    family_invite_notifications_enabled: bool = True
    quiet_hours_enabled: bool = False
    quiet_hours_start: str | None = Field(None, max_length=5)
    quiet_hours_end: str | None = Field(None, max_length=5)


class AiPrivacySettings(BaseModel):
    ai_use_health_records: bool = True
    ai_use_documents: bool = True
    ai_use_doctor_reports: bool = True
    ai_use_profile: bool = True


class HealthProfileSettings(BaseModel):
    birth_year: int | None = Field(None, ge=1900, le=2100)
    biological_sex: str | None = Field(None, max_length=30)
    height_cm: float | None = Field(None, ge=30, le=260)
    weight_kg: float | None = Field(None, ge=1, le=400)
    blood_type: str | None = Field(None, max_length=10)
    chronic_conditions: str | None = None
    allergies: str | None = None
    emergency_contact_name: str | None = Field(None, max_length=255)
    emergency_contact_phone: str | None = Field(None, max_length=50)


class SettingsResponse(NotificationSettings, AiPrivacySettings, HealthProfileSettings):
    updated_at: datetime | None = None


class SettingsUpdate(NotificationSettings, AiPrivacySettings, HealthProfileSettings):
    pass


class DeleteAccountRequest(BaseModel):
    password: str
    confirmation: str


SETTINGS_FIELDS = [
    "notifications_enabled",
    "voice_notifications_enabled",
    "medication_reminders_enabled",
    "family_invite_notifications_enabled",
    "quiet_hours_enabled",
    "quiet_hours_start",
    "quiet_hours_end",
    "ai_use_health_records",
    "ai_use_documents",
    "ai_use_doctor_reports",
    "ai_use_profile",
    "birth_year",
    "biological_sex",
    "height_cm",
    "weight_kg",
    "blood_type",
    "chronic_conditions",
    "allergies",
    "emergency_contact_name",
    "emergency_contact_phone",
]


def _settings_payload(user: User) -> dict:
    payload = {field: getattr(user, field) for field in SETTINGS_FIELDS}
    payload["updated_at"] = user.updated_at
    return payload


def _jsonable(value):
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    return value


def _row_payload(row, exclude: set[str] | None = None) -> dict:
    excluded = exclude or set()
    return {
        column.name: _jsonable(getattr(row, column.name))
        for column in row.__table__.columns
        if column.name not in excluded
    }


def _rows(db: Session, model, *filters, exclude: set[str] | None = None) -> list[dict]:
    return [_row_payload(row, exclude=exclude) for row in db.query(model).filter(*filters).all()]


@router.get("", response_model=SettingsResponse, summary="Kullanıcı ayarları")
async def get_settings(current_user: User = Depends(get_current_user)):
    return _settings_payload(current_user)


@router.put("", response_model=SettingsResponse, summary="Kullanıcı ayarlarını güncelle")
async def update_settings(
    payload: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    for field, value in data.items():
        setattr(current_user, field, value)

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return _settings_payload(current_user)


@router.get("/export", summary="Kullanıcı verilerini dışa aktar")
async def export_account_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id
    documents = db.query(Document).filter(Document.user_id == user_id).all()
    document_ids = [document.id for document in documents]
    sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).all()
    session_ids = [session.id for session in sessions]

    return {
        "exported_at": datetime.utcnow().isoformat(),
        "user": _row_payload(current_user, exclude={"hashed_password"}),
        "settings": _settings_payload(current_user),
        "health": {
            "symptoms": _rows(db, SymptomLog, SymptomLog.user_id == user_id),
            "medications": _rows(db, MedicationLog, MedicationLog.user_id == user_id),
            "sleep": _rows(db, SleepLog, SleepLog.user_id == user_id),
            "nutrition": _rows(db, NutritionLog, NutritionLog.user_id == user_id),
            "voice_usage": _rows(db, VoiceUsageLog, VoiceUsageLog.user_id == user_id),
        },
        "documents": [_row_payload(document) for document in documents],
        "ai": {
            "document_analyses": (
                [_row_payload(row) for row in db.query(AIAnalysis).filter(AIAnalysis.document_id.in_(document_ids)).all()]
                if document_ids
                else []
            ),
            "doctor_reports": _rows(db, DoctorPrepReport, DoctorPrepReport.user_id == user_id),
        },
        "chat": {
            "sessions": [_row_payload(session) for session in sessions],
            "messages": (
                [_row_payload(row) for row in db.query(ChatMessage).filter(ChatMessage.session_id.in_(session_ids)).all()]
                if session_ids
                else []
            ),
        },
        "family": {
            "members": _rows(db, FamilyMember, FamilyMember.user_id == user_id),
            "entries": _rows(db, FamilyHealthEntry, FamilyHealthEntry.user_id == user_id),
            "sent_invitations": _rows(db, FamilyInvitation, FamilyInvitation.inviter_user_id == user_id),
            "received_invitations": _rows(db, FamilyInvitation, FamilyInvitation.invitee_email == current_user.email),
            "accesses_as_owner": _rows(db, FamilyAccess, FamilyAccess.owner_user_id == user_id),
            "accesses_as_watcher": _rows(db, FamilyAccess, FamilyAccess.watcher_user_id == user_id),
        },
        "billing": _rows(db, SubscriptionEvent, SubscriptionEvent.user_id == user_id),
    }


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT, summary="Kullanıcı hesabını sil")
async def delete_account(
    payload: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.confirmation.strip().upper() != "HESABIMI SIL":
        raise HTTPException(status_code=400, detail="Onay metni hatali.")
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Şifre hatalı.")

    db.delete(current_user)
    db.commit()
