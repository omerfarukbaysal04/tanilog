import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.web_completion import NotificationEvent, PushSubscription
from app.routers.auth import get_current_user

try:
    from pywebpush import WebPushException, webpush
except Exception:  # pragma: no cover - optional dependency in dev containers
    WebPushException = Exception
    webpush = None

router = APIRouter()


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionPayload(BaseModel):
    endpoint: str
    keys: PushKeys


def _subscription_info(subscription: PushSubscription) -> dict:
    return {
        "endpoint": subscription.endpoint,
        "keys": {
            "p256dh": subscription.p256dh,
            "auth": subscription.auth,
        },
    }


def _send(subscription: PushSubscription, title: str, body: str, route: str | None = None) -> bool:
    if not webpush or not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        return False
    try:
        webpush(
            subscription_info=_subscription_info(subscription),
            data=json.dumps({"title": title, "body": body, "route": route or "/dashboard"}, ensure_ascii=False),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
        )
        return True
    except WebPushException:
        return False


@router.get("/config", summary="Web Push yapılandırması")
async def get_push_config():
    return {
        "enabled": bool(settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY and webpush),
        "public_key": settings.VAPID_PUBLIC_KEY,
        "provider": "web_push",
    }


@router.get("/subscriptions", summary="Push abonelikleri")
async def list_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.is_active.is_(True),
    ).order_by(PushSubscription.created_at.desc()).all()
    return [{"id": row.id, "endpoint": row.endpoint, "created_at": row.created_at, "provider": row.provider} for row in rows]


@router.post("/subscriptions", status_code=status.HTTP_201_CREATED, summary="Push aboneliği kaydet")
async def save_subscription(
    payload: PushSubscriptionPayload,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == payload.endpoint).first()
    if existing:
        existing.user_id = current_user.id
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
        existing.is_active = True
        existing.updated_at = datetime.utcnow()
        subscription = existing
    else:
        subscription = PushSubscription(
            user_id=current_user.id,
            endpoint=payload.endpoint,
            p256dh=payload.keys.p256dh,
            auth=payload.keys.auth,
            user_agent=request.headers.get("user-agent"),
        )
        db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return {"id": subscription.id, "enabled": True}


@router.delete("/subscriptions/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Push aboneliği sil")
async def delete_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subscription = db.query(PushSubscription).filter(
        PushSubscription.id == subscription_id,
        PushSubscription.user_id == current_user.id,
    ).first()
    if subscription:
        subscription.is_active = False
        db.commit()


@router.post("/test", summary="Test Web Push bildirimi")
async def send_test_push(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subscriptions = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.is_active.is_(True),
    ).all()
    if not subscriptions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aktif push aboneliği yok.")
    sent_count = 0
    for subscription in subscriptions:
        if _send(subscription, "TanıLog test bildirimi", "Web Push altyapısı çalışıyor.", "/settings"):
            sent_count += 1
    db.add(NotificationEvent(
        user_id=current_user.id,
        event_type="system_test",
        title="TanıLog test bildirimi",
        body="Web Push test bildirimi oluşturuldu.",
        route="/settings",
        delivered_at=datetime.utcnow() if sent_count else None,
    ))
    db.commit()
    return {
        "sent": sent_count,
        "total_subscriptions": len(subscriptions),
        "configured": bool(settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY and webpush),
    }


# ============================================================================
# EXPO PUSH (Mobil)
# ============================================================================

class ExpoTokenPayload(BaseModel):
    token: str
    platform: str | None = None  # "ios" | "android"


@router.post("/expo/register", status_code=status.HTTP_201_CREATED, summary="Expo push token kaydet")
async def register_expo_token(
    payload: ExpoTokenPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.token or not payload.token.startswith("ExponentPushToken"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz Expo push token.")

    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == payload.token).first()
    if existing:
        existing.user_id = current_user.id
        existing.is_active = True
        existing.provider = "expo"
        existing.user_agent = payload.platform or existing.user_agent
        existing.updated_at = datetime.utcnow()
        subscription = existing
    else:
        subscription = PushSubscription(
            user_id=current_user.id,
            endpoint=payload.token,
            p256dh="__expo__",
            auth="__expo__",
            provider="expo",
            user_agent=payload.platform,
        )
        db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return {"id": subscription.id, "enabled": True}


@router.delete("/expo/unregister", status_code=status.HTTP_204_NO_CONTENT, summary="Expo push token sil")
async def unregister_expo_token(
    payload: ExpoTokenPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(PushSubscription).filter(
        PushSubscription.endpoint == payload.token,
        PushSubscription.user_id == current_user.id,
    ).first()
    if sub:
        sub.is_active = False
        db.commit()


@router.post("/expo/test", summary="Test Expo push bildirimi")
async def send_test_expo_push(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.push_service import dispatch_push

    result = dispatch_push(
        db,
        user_id=current_user.id,
        title="TanıLog test bildirimi",
        body="Push altyapısı çalışıyor. Bu bir test.",
        route="/notifications",
        data={"event_type": "system_test"},
    )
    db.add(NotificationEvent(
        user_id=current_user.id,
        event_type="system_test",
        title="TanıLog test bildirimi",
        body="Push altyapısı çalışıyor. Bu bir test.",
        route="/notifications",
        delivered_at=datetime.utcnow() if result["total"] else None,
    ))
    db.commit()
    if result["total"] == 0:
        detail_parts = [
            f"Toplam abonelik: {result.get('subscriptions', 0)}",
            f"Expo abonelik: {result.get('expo_subscriptions', 0)}",
        ]
        errors = result.get("errors") or []
        if errors:
            detail_parts.append("Sebep: " + "; ".join(errors[:3]))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bildirim gönderilemedi. " + " | ".join(detail_parts),
        )
    return result
