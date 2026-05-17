from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.health import MedicationLog, NutritionLog, SleepLog, SymptomLog
from app.models.user import User
from app.models.web_completion import OnboardingState
from app.routers.auth import get_current_user

router = APIRouter()

STEPS = [
    "health_profile_done",
    "notifications_done",
    "first_record_done",
    "first_document_done",
    "ai_permissions_done",
]


class OnboardingUpdate(BaseModel):
    step: str = Field(pattern="^(health_profile_done|notifications_done|first_record_done|first_document_done|ai_permissions_done)$")
    done: bool = True


def _state(db: Session, user: User) -> OnboardingState:
    state = db.query(OnboardingState).filter(OnboardingState.user_id == user.id).first()
    if state:
        return state
    state = OnboardingState(user_id=user.id)
    db.add(state)
    db.flush()
    return state


def _auto_sync(db: Session, user: User, state: OnboardingState) -> None:
    state.health_profile_done = state.health_profile_done or any([
        user.birth_year,
        user.biological_sex,
        user.height_cm,
        user.weight_kg,
        user.chronic_conditions,
        user.allergies,
    ])
    state.first_record_done = state.first_record_done or any(
        db.query(model).filter(model.user_id == user.id).first()
        for model in (SymptomLog, MedicationLog, SleepLog, NutritionLog)
    )
    state.first_document_done = state.first_document_done or bool(
        db.query(Document).filter(Document.user_id == user.id, Document.is_deleted.is_(False)).first()
    )
    state.ai_permissions_done = state.ai_permissions_done or any([
        user.ai_use_health_records,
        user.ai_use_documents,
        user.ai_use_doctor_reports,
        user.ai_use_profile,
    ])
    if all(getattr(state, step) for step in STEPS) and not state.completed_at:
        state.completed_at = datetime.utcnow()


def _payload(state: OnboardingState) -> dict:
    completed = [step for step in STEPS if getattr(state, step)]
    return {
        "steps": {step: getattr(state, step) for step in STEPS},
        "completed_count": len(completed),
        "total_count": len(STEPS),
        "is_complete": len(completed) == len(STEPS) or state.skipped,
        "skipped": state.skipped,
        "completed_at": state.completed_at,
    }


@router.get("", summary="Onboarding durumu")
async def get_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    state = _state(db, current_user)
    _auto_sync(db, current_user, state)
    db.commit()
    db.refresh(state)
    return _payload(state)


@router.post("/step", summary="Onboarding adımı güncelle")
async def update_onboarding_step(
    payload: OnboardingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    state = _state(db, current_user)
    setattr(state, payload.step, payload.done)
    if all(getattr(state, step) for step in STEPS):
        state.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(state)
    return _payload(state)


@router.post("/skip", summary="Onboarding atla")
async def skip_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    state = _state(db, current_user)
    state.skipped = True
    state.completed_at = state.completed_at or datetime.utcnow()
    db.commit()
    db.refresh(state)
    return _payload(state)
