from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_analysis import AIAnalysis, DoctorPrepReport
from app.models.chat import ChatSession
from app.models.document import Document
from app.models.family import FamilyInvitation
from app.models.health import MedicationLog, NutritionLog, SleepLog, SymptomLog
from app.models.subscription import SubscriptionEvent
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


class PremiumUpdate(BaseModel):
    plan: str = Field("monthly", pattern="^(free|monthly|yearly)$")
    days: int = Field(30, ge=1, le=730)


class AdminUpdate(BaseModel):
    is_admin: bool


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu alan sadece yoneticiler icindir.",
        )
    return current_user


def _user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_premium": user.is_premium,
        "is_admin": user.is_admin,
        "subscription_plan": user.subscription_plan,
        "premium_until": user.premium_until,
        "created_at": user.created_at,
    }


@router.get("/overview", summary="Admin genel özet")
async def get_admin_overview(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=7)
    health_count = sum(
        db.query(func.count(model.id)).scalar() or 0
        for model in (SymptomLog, MedicationLog, SleepLog, NutritionLog)
    )

    return {
        "users": db.query(func.count(User.id)).scalar() or 0,
        "premium_users": db.query(func.count(User.id)).filter(User.is_premium.is_(True)).scalar() or 0,
        "new_users_7d": db.query(func.count(User.id)).filter(User.created_at >= since).scalar() or 0,
        "health_records": health_count,
        "documents": db.query(func.count(Document.id)).filter(Document.is_deleted.is_(False)).scalar() or 0,
        "ai_analyses": db.query(func.count(AIAnalysis.id)).scalar() or 0,
        "doctor_reports": db.query(func.count(DoctorPrepReport.id)).scalar() or 0,
        "chat_sessions": db.query(func.count(ChatSession.id)).scalar() or 0,
        "pending_family_invites": (
            db.query(func.count(FamilyInvitation.id))
            .filter(FamilyInvitation.status == "pending")
            .scalar()
            or 0
        ),
        "subscription_events": db.query(func.count(SubscriptionEvent.id)).scalar() or 0,
    }


@router.get("/users", summary="Admin kullanıcı listesi")
async def list_admin_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).limit(100).all()
    return [_user_payload(user) for user in users]


@router.patch("/users/{user_id}/premium", summary="Admin premium guncelle")
async def update_user_premium(
    user_id: int,
    payload: PremiumUpdate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    if payload.plan == "free":
        user.is_premium = False
        user.subscription_plan = "free"
        user.premium_until = None
    else:
        user.is_premium = True
        user.subscription_plan = payload.plan
        user.premium_until = datetime.utcnow() + timedelta(days=payload.days)

    event = SubscriptionEvent(
        user_id=user.id,
        event_type="admin_plan_updated",
        plan=payload.plan,
        provider="admin",
        provider_session_id=f"admin-{admin_user.id}-{int(datetime.utcnow().timestamp())}",
        status="completed",
        completed_at=datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    db.refresh(user)
    return _user_payload(user)


@router.patch("/users/{user_id}/admin", summary="Admin yetkisi guncelle")
async def update_user_admin(
    user_id: int,
    payload: AdminUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if current_user.id == user_id and not payload.is_admin:
        raise HTTPException(status_code=400, detail="Kendi admin yetkinizi kaldiramazsiniz.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    user.is_admin = payload.is_admin
    db.commit()
    db.refresh(user)
    return _user_payload(user)
