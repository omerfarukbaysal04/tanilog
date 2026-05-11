from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subscription import SubscriptionEvent
from app.models.user import User
from app.routers.auth import get_current_user
from app.routers.users import is_premium_active

router = APIRouter()

PLAN_CATALOG = {
    "free": {
        "name": "Ucretsiz",
        "price": 0,
        "currency": "TRY",
        "interval": "forever",
        "features": [
            "Ayda 3 belge yukleme",
            "Gunluk temel saglik kaydi",
            "Sinirli sesli giris",
            "Reklamli deneyim",
        ],
    },
    "monthly": {
        "name": "Premium Aylik",
        "price": 119,
        "currency": "TRY",
        "interval": "month",
        "days": 30,
        "features": [
            "Sinirsiz AI belge ve saglik analizi",
            "Doktora Hazirlan raporlari",
            "Aile takibi ve premium AI asistan",
            "Reklamsiz deneyim",
        ],
    },
    "yearly": {
        "name": "Premium Yillik",
        "price": 1100,
        "currency": "TRY",
        "interval": "year",
        "days": 365,
        "features": [
            "Aylik plana dahil tum ozellikler",
            "Yillik odemede avantajli fiyat",
            "Oncelikli yeni ozellik erisimi",
            "Reklamsiz deneyim",
        ],
    },
}


class CheckoutRequest(BaseModel):
    plan: str = Field(..., pattern="^(monthly|yearly)$")


class CheckoutCompleteRequest(BaseModel):
    session_id: str


def _subscription_payload(user: User) -> dict:
    active = is_premium_active(user)
    return {
        "is_premium": active,
        "subscription_plan": user.subscription_plan if active else "free",
        "premium_until": user.premium_until,
        "days_remaining": max((user.premium_until - datetime.utcnow()).days, 0)
        if active and user.premium_until
        else 0,
        "ad_free": active,
    }


@router.get("/plans", summary="Premium plan katalogu")
async def get_plans():
    return {"plans": PLAN_CATALOG, "provider": "mock"}


@router.get("/subscription", summary="Mevcut abonelik durumu")
async def get_subscription(current_user: User = Depends(get_current_user)):
    return _subscription_payload(current_user)


@router.get("/events", summary="Abonelik islem gecmisi")
async def get_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    events = (
        db.query(SubscriptionEvent)
        .filter(SubscriptionEvent.user_id == current_user.id)
        .order_by(SubscriptionEvent.created_at.desc())
        .limit(20)
        .all()
    )
    return {
        "events": [
            {
                "id": event.id,
                "event_type": event.event_type,
                "plan": event.plan,
                "provider": event.provider,
                "provider_session_id": event.provider_session_id,
                "amount": float(event.amount or 0),
                "currency": event.currency,
                "status": event.status,
                "created_at": event.created_at,
                "completed_at": event.completed_at,
            }
            for event in events
        ]
    }


@router.post("/checkout", status_code=status.HTTP_201_CREATED, summary="Mock odeme oturumu olustur")
async def create_checkout(
    payload: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = PLAN_CATALOG[payload.plan]
    session_id = f"mock_{uuid4().hex}"
    event = SubscriptionEvent(
        user_id=current_user.id,
        event_type="checkout_created",
        plan=payload.plan,
        provider="mock",
        provider_session_id=session_id,
        amount=Decimal(str(plan["price"])),
        currency=plan["currency"],
        status="pending",
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "session_id": session_id,
        "provider": "mock",
        "plan": payload.plan,
        "amount": plan["price"],
        "currency": plan["currency"],
        "checkout_url": f"/billing?checkout={session_id}",
        "message": "Test odeme oturumu olusturuldu. Gercek saglayici entegrasyonunda bu URL odeme sayfasina yonlenir.",
    }


@router.post("/checkout/complete", summary="Mock odemeyi tamamla")
async def complete_checkout(
    payload: CheckoutCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = (
        db.query(SubscriptionEvent)
        .filter(
            SubscriptionEvent.user_id == current_user.id,
            SubscriptionEvent.provider_session_id == payload.session_id,
        )
        .first()
    )
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Odeme oturumu bulunamadi.")
    if event.status == "completed":
        return {"subscription": _subscription_payload(current_user), "event_id": event.id}
    if event.plan not in ("monthly", "yearly"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Gecersiz plan.")

    base_date = current_user.premium_until if is_premium_active(current_user) else datetime.utcnow()
    current_user.is_premium = True
    current_user.subscription_plan = event.plan
    current_user.premium_until = base_date + timedelta(days=PLAN_CATALOG[event.plan]["days"])
    current_user.updated_at = datetime.utcnow()
    event.status = "completed"
    event.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {"subscription": _subscription_payload(current_user), "event_id": event.id}


@router.post("/cancel", summary="Premium aboneligi iptal et")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not is_premium_active(current_user):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aktif Premium abonelik bulunmuyor.")

    event = SubscriptionEvent(
        user_id=current_user.id,
        event_type="subscription_cancelled",
        plan=current_user.subscription_plan,
        provider="mock",
        provider_session_id=f"cancel_{uuid4().hex}",
        amount=Decimal("0"),
        currency="TRY",
        status="completed",
        completed_at=datetime.utcnow(),
    )
    current_user.is_premium = False
    current_user.subscription_plan = "free"
    current_user.premium_until = None
    current_user.updated_at = datetime.utcnow()
    db.add(event)
    db.commit()
    db.refresh(current_user)

    return {"subscription": _subscription_payload(current_user), "event_id": event.id}
