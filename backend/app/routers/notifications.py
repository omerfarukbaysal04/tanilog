from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.web_completion import NotificationEvent
from app.routers.auth import get_current_user

router = APIRouter()


def _payload(item: NotificationEvent) -> dict:
    return {
        "id": f"server-{item.id}",
        "server_id": item.id,
        "type": item.event_type,
        "title": item.title,
        "body": item.body,
        "route": item.route,
        "priority": item.priority,
        "created_at": item.created_at,
        "eventTime": item.created_at,
        "read": item.is_read,
        "delivered_at": item.delivered_at,
    }


@router.get("", summary="Bildirim merkezi olayları")
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(NotificationEvent).filter(
        NotificationEvent.user_id == current_user.id,
    ).order_by(NotificationEvent.created_at.desc()).limit(50).all()
    return [_payload(row) for row in rows]


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(NotificationEvent).filter(
        NotificationEvent.id == notification_id,
        NotificationEvent.user_id == current_user.id,
    ).first()
    if row:
        row.is_read = True
        db.commit()


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(NotificationEvent).filter(NotificationEvent.user_id == current_user.id).update({"is_read": True})
    db.commit()
