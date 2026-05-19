"""Push notification gönderme servisi.

Web Push (VAPID) ve Expo Push (mobil) için tek noktadan dispatch.
"""

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from app.config import settings
from app.models.web_completion import NotificationEvent, PushSubscription

logger = logging.getLogger("tanilog.push")

try:
    import httpx
except Exception:
    httpx = None

try:
    from pywebpush import WebPushException, webpush
except Exception:
    WebPushException = Exception
    webpush = None


EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _send_web_push(subscription: PushSubscription, title: str, body: str, route: str | None) -> bool:
    if not webpush or not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        return False
    try:
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
            },
            data=json.dumps({"title": title, "body": body, "route": route or "/dashboard"}, ensure_ascii=False),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
        )
        return True
    except WebPushException as exc:
        logger.warning("web_push_failed sub_id=%s err=%s", subscription.id, exc)
        return False
    except Exception:
        logger.exception("web_push_unexpected sub_id=%s", subscription.id)
        return False


def _send_expo_push(tokens: list[str], title: str, body: str, data: dict[str, Any] | None = None) -> int:
    """Expo Push API'ye toplu gönderim. Başarılı gönderim sayısını döner."""
    if not httpx or not tokens:
        return 0
    messages = [
        {
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
            "data": data or {},
            "priority": "high",
            "channelId": "default",
        }
        for token in tokens
    ]
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "accept": "application/json",
                    "accept-encoding": "gzip, deflate",
                    "content-type": "application/json",
                },
            )
            response.raise_for_status()
            payload = response.json()
            tickets = payload.get("data", [])
            sent = sum(1 for t in tickets if isinstance(t, dict) and t.get("status") == "ok")
            errors = [t for t in tickets if isinstance(t, dict) and t.get("status") == "error"]
            if errors:
                logger.warning("expo_push_partial_errors count=%d sample=%s", len(errors), errors[:2])
            return sent
    except Exception:
        logger.exception("expo_push_failed token_count=%d", len(tokens))
        return 0


def dispatch_push(
    db: Session,
    user_id: int,
    title: str,
    body: str,
    route: str | None = None,
    data: dict[str, Any] | None = None,
) -> dict[str, int]:
    """Kullanıcının aktif tüm push abonelikleriyle (web + expo) bildirim gönderir."""
    subs = (
        db.query(PushSubscription)
        .filter(PushSubscription.user_id == user_id, PushSubscription.is_active.is_(True))
        .all()
    )
    if not subs:
        return {"web": 0, "expo": 0, "total": 0}

    web_sent = 0
    expo_tokens: list[str] = []
    for sub in subs:
        if sub.provider == "expo":
            expo_tokens.append(sub.endpoint)
        else:
            if _send_web_push(sub, title, body, route):
                web_sent += 1

    expo_payload = {"route": route or "/dashboard", **(data or {})}
    expo_sent = _send_expo_push(expo_tokens, title, body, expo_payload)

    return {"web": web_sent, "expo": expo_sent, "total": web_sent + expo_sent}


def emit_notification_event(
    db: Session,
    *,
    user_id: int,
    event_type: str,
    title: str,
    body: str,
    route: str | None = None,
    priority: str = "normal",
    push: bool = True,
) -> NotificationEvent:
    """NotificationEvent kaydeder ve istenirse push gönderir.

    Caller commit yapmalı. Push gönderimi flush sonrası yapılır.
    """
    event = NotificationEvent(
        user_id=user_id,
        event_type=event_type,
        title=title,
        body=body,
        route=route,
        priority=priority,
    )
    db.add(event)
    db.flush()

    if push:
        try:
            result = dispatch_push(db, user_id, title, body, route, {"event_type": event_type})
            if result["total"] > 0:
                from datetime import datetime

                event.delivered_at = datetime.utcnow()
        except Exception:
            logger.exception("dispatch_push_failed user_id=%s", user_id)

    return event
