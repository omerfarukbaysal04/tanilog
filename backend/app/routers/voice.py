from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.health import VoiceUsageLog
from app.models.user import User
from app.routers.auth import get_current_user
from app.routers.users import get_daily_limit, is_premium_active
from app.schemas.voice import VoiceParseRequest, VoiceParseResponse, VoiceUsageResponse
from app.services.voice_service import parse_voice_transcript, transcribe_voice_audio

router = APIRouter()


def _get_usage(db: Session, user_id: int, usage_date: date) -> VoiceUsageLog:
    usage = db.query(VoiceUsageLog).filter(
        VoiceUsageLog.user_id == user_id,
        VoiceUsageLog.date == usage_date
    ).first()
    if usage:
        return usage

    usage = VoiceUsageLog(user_id=user_id, date=usage_date, count=0)
    db.add(usage)
    db.commit()
    db.refresh(usage)
    return usage


def _usage_response(user: User, usage: VoiceUsageLog) -> VoiceUsageResponse:
    limit = get_daily_limit(user, "voice_input")
    premium = is_premium_active(user)
    remaining = None if limit == -1 else max(0, limit - usage.count)
    return VoiceUsageResponse(
        limit=limit,
        used_today=usage.count,
        remaining=remaining,
        is_premium=premium,
    )


@router.get("/usage", response_model=VoiceUsageResponse)
async def get_voice_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    usage = _get_usage(db, current_user.id, date.today())
    return _usage_response(current_user, usage)


@router.post("/parse", response_model=VoiceParseResponse)
async def parse_voice_input(
    payload: VoiceParseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    usage_date = date.today()
    usage = _get_usage(db, current_user.id, usage_date)
    limit = get_daily_limit(current_user, "voice_input")

    if limit != -1 and usage.count >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ücretsiz planda günlük 3 sesli giriş hakkınız doldu. Premium ile sesli asistanı sınırsız kullanabilirsiniz."
        )

    target_date = payload.target_date or usage_date
    parsed = parse_voice_transcript(payload.transcript.strip(), target_date)

    if limit != -1:
        usage.count += 1
        db.commit()
        db.refresh(usage)

    return VoiceParseResponse(
        transcript=payload.transcript.strip(),
        intent=parsed["intent"],
        confidence=parsed["confidence"],
        extracted_data=parsed["extracted_data"],
        suggested_action=parsed.get("suggested_action", "review"),
        warnings=parsed.get("warnings", []),
        usage=_usage_response(current_user, usage),
    )


@router.post("/transcribe")
async def transcribe_voice_input(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ses kaydı boş görünüyor.")
    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Ses kaydı 10 MB sınırını aşıyor.")

    transcript = transcribe_voice_audio(audio_bytes, file.content_type or "audio/webm")
    if not transcript:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Ses kaydı metne çevrilemedi. Lütfen tekrar deneyin.")

    return {"transcript": transcript}
