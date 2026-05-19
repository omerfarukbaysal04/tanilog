import json
from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.web_completion import NotificationEvent, RiskAlert
from app.services.push_service import dispatch_push
from app.routers.auth import get_current_user
from app.services.risk_service import evaluate_user_risks

router = APIRouter()


def _to_dict(alert: RiskAlert) -> dict:
    return {
        "id": alert.id,
        "rule_key": alert.rule_key,
        "severity": alert.severity,
        "title": alert.title,
        "message": alert.message,
        "evidence": json.loads(alert.evidence) if alert.evidence else None,
        "route": alert.route,
        "is_dismissed": alert.is_dismissed,
        "created_at": alert.created_at,
    }


@router.get("", summary="Riskli örüntü uyarıları")
async def list_risk_alerts(
    refresh: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if refresh:
        generated = evaluate_user_risks(db, current_user.id)
        for item in generated:
            exists = db.query(RiskAlert).filter(
                RiskAlert.user_id == current_user.id,
                RiskAlert.rule_key == item["rule_key"],
                RiskAlert.is_dismissed.is_(False),
            ).first()
            if exists:
                exists.title = item["title"]
                exists.message = item["message"]
                exists.evidence = item["evidence"]
                exists.route = item["route"]
                exists.created_at = datetime.utcnow()
                continue
            alert = RiskAlert(user_id=current_user.id, **item)
            db.add(alert)
            db.add(NotificationEvent(
                user_id=current_user.id,
                event_type="risk_alert",
                title=item["title"],
                body=item["message"],
                route=item["route"],
                priority="important" if item["severity"] == "warning" else "normal",
            ))
            try:
                dispatch_push(
                    db,
                    user_id=current_user.id,
                    title=item["title"],
                    body=item["message"],
                    route=item["route"],
                    data={"event_type": "risk_alert", "severity": item["severity"]},
                )
            except Exception:
                pass
        db.commit()

    alerts = db.query(RiskAlert).filter(
        RiskAlert.user_id == current_user.id,
        RiskAlert.is_dismissed.is_(False),
    ).order_by(RiskAlert.created_at.desc()).limit(20).all()
    return [_to_dict(alert) for alert in alerts]


@router.post("/{alert_id}/dismiss", status_code=status.HTTP_204_NO_CONTENT)
async def dismiss_risk_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id, RiskAlert.user_id == current_user.id).first()
    if alert:
        alert.is_dismissed = True
        db.commit()
