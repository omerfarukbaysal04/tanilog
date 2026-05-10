import json
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_analysis import AIAnalysis, DoctorPrepReport
from app.models.chat import ChatMessage, ChatSession
from app.models.document import Document
from app.models.health import MedicationLog, NutritionLog, SleepLog, SymptomLog
from app.models.user import User
from app.routers.auth import get_current_user
from app.routers.users import is_premium_active
from app.services.ai_service import generate_chatbot_attachment_response, generate_chatbot_response

router = APIRouter()
ALLOWED_CHAT_UPLOAD_TYPES = {"application/pdf", "image/jpeg", "image/jpg", "image/png", "text/plain"}
MAX_CHAT_UPLOAD_SIZE = 5 * 1024 * 1024


class ChatSessionCreate(BaseModel):
    title: str | None = Field(None, max_length=255)


class ChatSessionUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class ChatMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


def _require_premium(user: User) -> None:
    if not is_premium_active(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium AI Chatbot yalnızca Premium kullanıcılar için kullanılabilir."
        )


def _serialize(value: Any):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _serialize_items(items, fields):
    return [{field: _serialize(getattr(item, field)) for field in fields} for item in items]


def _chat_context(db: Session, user: User) -> dict:
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=29)

    symptoms = db.query(SymptomLog).filter(
        SymptomLog.user_id == user.id,
        SymptomLog.date >= start_date,
        SymptomLog.date <= end_date,
    ).order_by(SymptomLog.date.desc()).limit(30).all()

    medications = db.query(MedicationLog).filter(
        MedicationLog.user_id == user.id,
        MedicationLog.date >= start_date,
        MedicationLog.date <= end_date,
    ).order_by(MedicationLog.date.desc()).limit(30).all()

    sleep = db.query(SleepLog).filter(
        SleepLog.user_id == user.id,
        SleepLog.date >= start_date,
        SleepLog.date <= end_date,
    ).order_by(SleepLog.date.desc()).limit(30).all()

    nutrition = db.query(NutritionLog).filter(
        NutritionLog.user_id == user.id,
        NutritionLog.date >= start_date,
        NutritionLog.date <= end_date,
    ).order_by(NutritionLog.date.desc()).limit(30).all()

    document_rows = db.query(Document, AIAnalysis).join(
        AIAnalysis,
        AIAnalysis.document_id == Document.id,
    ).filter(
        Document.user_id == user.id,
        Document.is_deleted == False,
    ).order_by(AIAnalysis.created_at.desc()).limit(5).all()

    doctor_reports = db.query(DoctorPrepReport).filter(
        DoctorPrepReport.user_id == user.id
    ).order_by(DoctorPrepReport.created_at.desc()).limit(3).all()

    return {
        "today": date.today().isoformat(),
        "user": {"full_name": user.full_name, "email": user.email},
        "date_range": {"start": start_date.isoformat(), "end": end_date.isoformat()},
        "health": {
            "symptoms": _serialize_items(symptoms, ["date", "symptom_name", "severity", "notes"]),
            "medications": _serialize_items(
                medications,
                ["date", "name", "dosage", "time_taken", "reminder_enabled", "reminder_time", "is_taken", "notes"]
            ),
            "sleep": _serialize_items(sleep, ["date", "hours_slept", "quality", "notes"]),
            "nutrition": _serialize_items(nutrition, ["date", "meal_type", "water_ml", "notes"]),
        },
        "document_analyses": [
            {
                "filename": document.original_filename,
                "category": document.category,
                "summary": analysis.summary,
                "critical_findings": analysis.critical_findings,
                "has_critical_alert": analysis.has_critical_alert,
            }
            for document, analysis in document_rows
        ],
        "doctor_reports": [
            {
                "title": report.title,
                "period_start": report.period_start,
                "period_end": report.period_end,
                "summary": report.summary,
                "created_at": report.created_at,
            }
            for report in doctor_reports
        ],
    }


def _message_to_dict(message: ChatMessage) -> dict:
    actions = []
    if message.suggested_actions:
        try:
            actions = json.loads(message.suggested_actions)
        except json.JSONDecodeError:
            actions = []

    return {
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "safety_level": message.safety_level,
        "suggested_actions": actions,
        "created_at": message.created_at,
    }


def _session_to_dict(session: ChatSession) -> dict:
    return {
        "id": session.id,
        "title": session.title,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }


def _session_or_404(db: Session, user_id: int, session_id: int) -> ChatSession:
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sohbet bulunamadı.")
    return session


@router.get("/sessions")
async def list_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).all()

    return [_session_to_dict(session) for session in sessions]


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    payload: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    session = ChatSession(
        user_id=current_user.id,
        title=(payload.title or "Yeni Sağlık Sohbeti")[:255],
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _session_to_dict(session)


@router.patch("/sessions/{session_id}")
async def rename_chat_session(
    session_id: int,
    payload: ChatSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    session = _session_or_404(db, current_user.id, session_id)
    session.title = payload.title.strip()[:255]
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return _session_to_dict(session)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    session = _session_or_404(db, current_user.id, session_id)
    db.delete(session)
    db.commit()
    return None


@router.get("/sessions/{session_id}/messages")
async def list_chat_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    _session_or_404(db, current_user.id, session_id)
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.user_id == current_user.id,
    ).order_by(ChatMessage.created_at.asc()).all()
    return [_message_to_dict(message) for message in messages]


@router.post("/sessions/{session_id}/messages")
async def send_chat_message(
    session_id: int,
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    session = _session_or_404(db, current_user.id, session_id)

    user_message = ChatMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="user",
        content=payload.message.strip(),
    )
    db.add(user_message)
    db.flush()

    previous = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id,
        ChatMessage.user_id == current_user.id,
    ).order_by(ChatMessage.created_at.asc()).all()

    history = [
        {
            "role": message.role,
            "content": message.content,
            "safety_level": message.safety_level,
        }
        for message in previous
    ]
    context = _chat_context(db, current_user)
    ai_result = generate_chatbot_response(payload.message.strip(), context, history)

    assistant_message = ChatMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="assistant",
        content=ai_result["answer"],
        safety_level=ai_result.get("safety_level"),
        suggested_actions=json.dumps(ai_result.get("suggested_actions", []), ensure_ascii=False),
    )
    db.add(assistant_message)

    if session.title == "Yeni Sağlık Sohbeti":
        session.title = payload.message.strip()[:60] or session.title
    session.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user_message)
    db.refresh(assistant_message)
    db.refresh(session)

    return {
        "session": _session_to_dict(session),
        "user_message": _message_to_dict(user_message),
        "assistant_message": _message_to_dict(assistant_message),
        "follow_up_questions": ai_result.get("follow_up_questions", []),
    }


@router.post("/sessions/{session_id}/attachments")
async def send_chat_attachment(
    session_id: int,
    message: str = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    session = _session_or_404(db, current_user.id, session_id)

    if file.content_type not in ALLOWED_CHAT_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yalnızca PDF, JPG, PNG veya metin dosyası yüklenebilir."
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dosya boş görünüyor.")
    if len(file_bytes) > MAX_CHAT_UPLOAD_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dosya boyutu en fazla 5 MB olabilir.")

    clean_message = message.strip()
    content = f"Dosya yüklendi: {file.filename}"
    if clean_message:
        content = f"{content}\nNot: {clean_message}"

    user_message = ChatMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="user",
        content=content,
    )
    db.add(user_message)
    db.flush()

    previous = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id,
        ChatMessage.user_id == current_user.id,
    ).order_by(ChatMessage.created_at.asc()).all()

    history = [
        {
            "role": chat_message.role,
            "content": chat_message.content,
            "safety_level": chat_message.safety_level,
        }
        for chat_message in previous
    ]
    context = _chat_context(db, current_user)
    ai_result = generate_chatbot_attachment_response(
        user_message=clean_message,
        file_bytes=file_bytes,
        mime_type=file.content_type or "application/octet-stream",
        filename=file.filename or "yuklenen-dosya",
        context=context,
        history=history,
    )

    assistant_message = ChatMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="assistant",
        content=ai_result["answer"],
        safety_level=ai_result.get("safety_level"),
        suggested_actions=json.dumps(ai_result.get("suggested_actions", []), ensure_ascii=False),
    )
    db.add(assistant_message)

    if session.title == "Yeni Sağlık Sohbeti":
        session.title = (clean_message or file.filename or session.title)[:60]
    session.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user_message)
    db.refresh(assistant_message)
    db.refresh(session)

    return {
        "session": _session_to_dict(session),
        "user_message": _message_to_dict(user_message),
        "assistant_message": _message_to_dict(assistant_message),
        "follow_up_questions": ai_result.get("follow_up_questions", []),
        "attachment": {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(file_bytes),
        },
    }
