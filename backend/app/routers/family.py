import secrets
from datetime import date, datetime, timedelta, time

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_analysis import AIAnalysis
from app.models.document import Document
from app.models.family import FamilyAccess, FamilyHealthEntry, FamilyInvitation, FamilyMember
from app.models.health import MedicationLog, NutritionLog, SleepLog, SymptomLog
from app.models.user import User
from app.routers.auth import get_current_user
from app.routers.users import is_premium_active

router = APIRouter()

ENTRY_CATEGORIES = {"symptom", "medication", "sleep", "nutrition", "document", "appointment", "note"}
ENTRY_STATUSES = {"note", "watching", "improved", "needs_attention", "resolved"}


class FamilyMemberCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    relation: str = Field(..., min_length=2, max_length=80)
    birth_year: int | None = Field(None, ge=1900, le=2100)
    phone: str | None = Field(None, max_length=40)
    emergency_contact: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=2000)


class FamilyMemberUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=255)
    relation: str | None = Field(None, min_length=2, max_length=80)
    birth_year: int | None = Field(None, ge=1900, le=2100)
    phone: str | None = Field(None, max_length=40)
    emergency_contact: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=2000)
    is_active: bool | None = None


class FamilyEntryCreate(BaseModel):
    entry_date: date
    category: str = Field(..., max_length=40)
    title: str = Field(..., min_length=2, max_length=180)
    severity: int | None = Field(None, ge=1, le=10)
    status: str = Field("note", max_length=40)
    details: str | None = Field(None, max_length=4000)


class FamilyInvitationCreate(BaseModel):
    invitee_email: EmailStr
    relation: str = Field(..., min_length=2, max_length=80)
    family_member_id: int | None = None
    can_view_documents: bool = True
    can_add_records: bool = False
    can_edit_records: bool = False
    can_generate_reports: bool = False
    message: str | None = Field(None, max_length=1000)


class SharedRecordCreate(BaseModel):
    category: str = Field(..., max_length=40)
    date: date
    title: str = Field(..., min_length=2, max_length=180)
    severity: int | None = Field(None, ge=1, le=10)
    dosage: str | None = Field(None, max_length=50)
    time_taken: time | None = None
    hours_slept: float | None = Field(None, ge=0, le=24)
    quality: str | None = Field(None, max_length=20)
    meal_type: str | None = Field(None, max_length=20)
    water_ml: int | None = Field(None, ge=0, le=10000)
    notes: str | None = Field(None, max_length=4000)


class SharedRecordUpdate(BaseModel):
    title: str | None = Field(None, min_length=2, max_length=180)
    severity: int | None = Field(None, ge=1, le=10)
    dosage: str | None = Field(None, max_length=50)
    time_taken: time | None = None
    hours_slept: float | None = Field(None, ge=0, le=24)
    quality: str | None = Field(None, max_length=20)
    meal_type: str | None = Field(None, max_length=20)
    water_ml: int | None = Field(None, ge=0, le=10000)
    notes: str | None = Field(None, max_length=4000)


def _require_premium(user: User) -> None:
    if not is_premium_active(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aile takibi Premium kullanıcılar için kullanılabilir."
        )


def _member_or_404(db: Session, user_id: int, member_id: int) -> FamilyMember:
    member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aile üyesi bulunamadı.")
    return member


def _entry_or_404(db: Session, user_id: int, member_id: int, entry_id: int) -> FamilyHealthEntry:
    entry = db.query(FamilyHealthEntry).filter(
        FamilyHealthEntry.id == entry_id,
        FamilyHealthEntry.family_member_id == member_id,
        FamilyHealthEntry.user_id == user_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aile sağlık kaydı bulunamadı.")
    return entry


def _member_to_dict(member: FamilyMember, entry_count: int = 0, document_count: int = 0) -> dict:
    return {
        "id": member.id,
        "full_name": member.full_name,
        "relation": member.relation,
        "birth_year": member.birth_year,
        "phone": member.phone,
        "emergency_contact": member.emergency_contact,
        "notes": member.notes,
        "is_active": member.is_active,
        "linked_user_id": member.linked_user_id,
        "entry_count": entry_count,
        "document_count": document_count,
        "created_at": member.created_at,
        "updated_at": member.updated_at,
    }


def _member_counts(db: Session, current_user_id: int, member: FamilyMember) -> tuple[int, int]:
    if member.linked_user_id:
        summary = _health_summary(db, member.linked_user_id)
        entry_count = _health_summary_count(summary)
        document_count = db.query(Document).filter(
            Document.user_id == member.linked_user_id,
            Document.is_deleted == False,
        ).count()
        return entry_count, document_count

    entry_count = db.query(FamilyHealthEntry).filter(FamilyHealthEntry.family_member_id == member.id).count()
    document_count = db.query(Document).filter(
        Document.family_member_id == member.id,
        Document.user_id == current_user_id,
        Document.is_deleted == False,
    ).count()
    return entry_count, document_count


def _entry_to_dict(entry: FamilyHealthEntry) -> dict:
    return {
        "id": entry.id,
        "family_member_id": entry.family_member_id,
        "entry_date": entry.entry_date,
        "category": entry.category,
        "title": entry.title,
        "severity": entry.severity,
        "status": entry.status,
        "details": entry.details,
        "created_at": entry.created_at,
    }


def _linked_entries(db: Session, owner_user_id: int) -> list[dict]:
    summary = _health_summary(db, owner_user_id)
    entries = []
    for item in summary["symptoms"]:
        entries.append({
            "id": f"symptom-{item['id']}",
            "family_member_id": None,
            "entry_date": item["date"],
            "category": "symptom",
            "title": item["symptom_name"],
            "severity": item["severity"],
            "status": "note",
            "details": item["notes"],
            "created_at": None,
        })
    for item in summary["medications"]:
        entries.append({
            "id": f"medication-{item['id']}",
            "family_member_id": None,
            "entry_date": item["date"],
            "category": "medication",
            "title": item["name"],
            "severity": None,
            "status": "note",
            "details": item["notes"],
            "created_at": None,
        })
    for item in summary["sleep"]:
        entries.append({
            "id": f"sleep-{item['id']}",
            "family_member_id": None,
            "entry_date": item["date"],
            "category": "sleep",
            "title": f"{item['hours_slept']} saat uyku",
            "severity": None,
            "status": "note",
            "details": item["notes"],
            "created_at": None,
        })
    for item in summary["nutrition"]:
        entries.append({
            "id": f"nutrition-{item['id']}",
            "family_member_id": None,
            "entry_date": item["date"],
            "category": "nutrition",
            "title": item["notes"] or item["meal_type"],
            "severity": None,
            "status": "note",
            "details": f"Su: {item['water_ml']} ml",
            "created_at": None,
        })
    return sorted(entries, key=lambda entry: entry["entry_date"], reverse=True)


def _document_to_dict(document: Document, analysis: AIAnalysis | None = None) -> dict:
    return {
        "id": document.id,
        "original_filename": document.original_filename,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "category": document.category,
        "notes": document.notes,
        "family_member_id": document.family_member_id,
        "created_at": document.created_at,
        "analysis": {
            "summary": analysis.summary,
            "critical_findings": analysis.critical_findings,
            "has_critical_alert": analysis.has_critical_alert,
            "created_at": analysis.created_at,
        } if analysis else None,
    }


def _owner_documents(db: Session, owner_user_id: int, limit: int = 20) -> list[dict]:
    rows = db.query(Document, AIAnalysis).outerjoin(
        AIAnalysis,
        AIAnalysis.document_id == Document.id,
    ).filter(
        Document.user_id == owner_user_id,
        Document.is_deleted == False,
    ).order_by(Document.created_at.desc()).limit(limit).all()
    return [_document_to_dict(document, analysis) for document, analysis in rows]


def _invitation_to_dict(invitation: FamilyInvitation, inviter: User | None = None) -> dict:
    return {
        "id": invitation.id,
        "inviter_user_id": invitation.inviter_user_id,
        "inviter_name": inviter.full_name if inviter else None,
        "family_member_id": invitation.family_member_id,
        "invitee_email": invitation.invitee_email,
        "relation": invitation.relation,
        "token": invitation.token,
        "status": invitation.status,
        "can_view_documents": invitation.can_view_documents,
        "can_add_records": invitation.can_add_records,
        "can_edit_records": invitation.can_edit_records,
        "can_generate_reports": invitation.can_generate_reports,
        "message": invitation.message,
        "expires_at": invitation.expires_at,
        "accepted_at": invitation.accepted_at,
        "created_at": invitation.created_at,
        "updated_at": invitation.updated_at,
    }


def _access_or_404(db: Session, watcher_user_id: int, access_id: int) -> FamilyAccess:
    access = db.query(FamilyAccess).filter(
        FamilyAccess.id == access_id,
        FamilyAccess.watcher_user_id == watcher_user_id,
        FamilyAccess.is_active == True,
    ).first()
    if not access:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paylaşımlı aile erişimi bulunamadı.")
    return access


def _access_to_dict(access: FamilyAccess, owner: User | None = None, member: FamilyMember | None = None) -> dict:
    return {
        "id": access.id,
        "owner_user_id": access.owner_user_id,
        "owner_name": owner.full_name if owner else None,
        "owner_email": owner.email if owner else None,
        "watcher_user_id": access.watcher_user_id,
        "family_member_id": access.family_member_id,
        "family_member_name": member.full_name if member else None,
        "relation": access.relation,
        "can_view_documents": access.can_view_documents,
        "can_add_records": access.can_add_records,
        "can_edit_records": access.can_edit_records,
        "can_generate_reports": access.can_generate_reports,
        "is_active": access.is_active,
        "created_at": access.created_at,
        "updated_at": access.updated_at,
    }


def _ensure_family_member_for_access(db: Session, access: FamilyAccess, owner: User | None = None) -> FamilyMember | None:
    """Create the sidebar family profile for accepted account-sharing invites."""
    if access.family_member_id:
        member = db.query(FamilyMember).filter(
            FamilyMember.id == access.family_member_id,
            FamilyMember.user_id == access.watcher_user_id,
        ).first()
        if member:
            if not member.linked_user_id:
                member.linked_user_id = access.owner_user_id
                member.updated_at = datetime.utcnow()
            return member

    owner = owner or db.query(User).filter(User.id == access.owner_user_id).first()
    if not owner:
        return None

    existing = db.query(FamilyMember).filter(
        FamilyMember.user_id == access.watcher_user_id,
        FamilyMember.linked_user_id == access.owner_user_id,
    ).first()
    if existing:
        access.family_member_id = existing.id
        access.updated_at = datetime.utcnow()
        return existing

    member = FamilyMember(
        user_id=access.watcher_user_id,
        linked_user_id=access.owner_user_id,
        full_name=owner.full_name or owner.email,
        relation=access.relation,
        notes="Davet ile gerçek TanıLog hesabına bağlandı.",
    )
    db.add(member)
    db.flush()
    access.family_member_id = member.id
    access.updated_at = datetime.utcnow()
    return member


def _health_summary(db: Session, owner_user_id: int, target_date: date | None = None) -> dict:
    symptoms = db.query(SymptomLog).filter(SymptomLog.user_id == owner_user_id)
    medications = db.query(MedicationLog).filter(MedicationLog.user_id == owner_user_id)
    sleep = db.query(SleepLog).filter(SleepLog.user_id == owner_user_id)
    nutrition = db.query(NutritionLog).filter(NutritionLog.user_id == owner_user_id)

    if target_date:
        symptoms = symptoms.filter(SymptomLog.date == target_date)
        medications = medications.filter(MedicationLog.date == target_date)
        sleep = sleep.filter(SleepLog.date == target_date)
        nutrition = nutrition.filter(NutritionLog.date == target_date)

    return {
        "symptoms": [
            {"id": item.id, "date": item.date, "symptom_name": item.symptom_name, "severity": item.severity, "notes": item.notes}
            for item in symptoms.order_by(SymptomLog.created_at.desc()).limit(30).all()
        ],
        "medications": [
            {
                "id": item.id,
                "date": item.date,
                "name": item.name,
                "dosage": item.dosage,
                "time_taken": item.time_taken,
                "reminder_enabled": item.reminder_enabled,
                "reminder_time": item.reminder_time,
                "is_taken": item.is_taken,
                "notes": item.notes,
            }
            for item in medications.order_by(MedicationLog.created_at.desc()).limit(30).all()
        ],
        "sleep": [
            {"id": item.id, "date": item.date, "hours_slept": item.hours_slept, "quality": item.quality, "notes": item.notes}
            for item in sleep.order_by(SleepLog.created_at.desc()).limit(30).all()
        ],
        "nutrition": [
            {"id": item.id, "date": item.date, "meal_type": item.meal_type, "water_ml": item.water_ml, "notes": item.notes}
            for item in nutrition.order_by(NutritionLog.created_at.desc()).limit(30).all()
        ],
    }


def _health_summary_count(summary: dict) -> int:
    return (
        len(summary.get("symptoms", [])) +
        len(summary.get("medications", [])) +
        len(summary.get("sleep", [])) +
        len(summary.get("nutrition", []))
    )


def _shared_record_or_404(db: Session, owner_user_id: int, category: str, record_id: int):
    model_map = {
        "symptom": SymptomLog,
        "medication": MedicationLog,
        "sleep": SleepLog,
        "nutrition": NutritionLog,
    }
    model = model_map.get(category)
    if not model:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz kayıt kategorisi.")
    record = db.query(model).filter(model.id == record_id, model.user_id == owner_user_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paylaşılan kayıt bulunamadı.")
    return record


@router.get("/members")
async def list_family_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    pending_accesses = db.query(FamilyAccess).filter(
        FamilyAccess.watcher_user_id == current_user.id,
        FamilyAccess.is_active == True,
    ).all()
    owner_ids = {access.owner_user_id for access in pending_accesses if not access.family_member_id}
    owners = {user.id: user for user in db.query(User).filter(User.id.in_(owner_ids)).all()} if owner_ids else {}
    changed = False
    for access in pending_accesses:
        if not access.family_member_id:
            member = _ensure_family_member_for_access(db, access, owners.get(access.owner_user_id))
            changed = changed or bool(member)
    if changed:
        db.commit()

    members = db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.id,
    ).order_by(FamilyMember.created_at.desc()).all()

    result = []
    for member in members:
        entry_count, document_count = _member_counts(db, current_user.id, member)
        result.append(_member_to_dict(member, entry_count, document_count))
    return result


@router.post("/members", status_code=status.HTTP_201_CREATED)
async def create_family_member(
    payload: FamilyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    member = FamilyMember(
        user_id=current_user.id,
        full_name=payload.full_name.strip(),
        relation=payload.relation.strip(),
        birth_year=payload.birth_year,
        phone=payload.phone,
        emergency_contact=payload.emergency_contact,
        notes=payload.notes,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return _member_to_dict(member)


@router.patch("/members/{member_id}")
async def update_family_member(
    member_id: int,
    payload: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    member = _member_or_404(db, current_user.id, member_id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(member, key, value)
    member.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(member)
    return _member_to_dict(member)


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    member = _member_or_404(db, current_user.id, member_id)
    linked_documents = db.query(Document).filter(
        Document.family_member_id == member.id,
        Document.user_id == current_user.id,
    ).all()
    for document in linked_documents:
        document.family_member_id = None
    db.delete(member)
    db.commit()
    return None


@router.get("/members/{member_id}/entries")
async def list_family_entries(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    member = _member_or_404(db, current_user.id, member_id)
    if member.linked_user_id:
        return _linked_entries(db, member.linked_user_id)
    entries = db.query(FamilyHealthEntry).filter(
        FamilyHealthEntry.family_member_id == member_id,
        FamilyHealthEntry.user_id == current_user.id,
    ).order_by(FamilyHealthEntry.entry_date.desc(), FamilyHealthEntry.created_at.desc()).all()
    return [_entry_to_dict(entry) for entry in entries]


@router.post("/members/{member_id}/entries", status_code=status.HTTP_201_CREATED)
async def create_family_entry(
    member_id: int,
    payload: FamilyEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    _member_or_404(db, current_user.id, member_id)
    if payload.category not in ENTRY_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz kayıt kategorisi.")
    if payload.status not in ENTRY_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz kayıt durumu.")

    entry = FamilyHealthEntry(
        user_id=current_user.id,
        family_member_id=member_id,
        entry_date=payload.entry_date,
        category=payload.category,
        title=payload.title.strip(),
        severity=payload.severity,
        status=payload.status,
        details=payload.details,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _entry_to_dict(entry)


@router.delete("/members/{member_id}/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family_entry(
    member_id: int,
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    _member_or_404(db, current_user.id, member_id)
    entry = _entry_or_404(db, current_user.id, member_id, entry_id)
    db.delete(entry)
    db.commit()
    return None


@router.get("/members/{member_id}/documents")
async def list_family_documents(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    member = _member_or_404(db, current_user.id, member_id)
    if member.linked_user_id:
        return _owner_documents(db, member.linked_user_id)
    rows = db.query(Document, AIAnalysis).outerjoin(
        AIAnalysis,
        AIAnalysis.document_id == Document.id,
    ).filter(
        Document.user_id == current_user.id,
        Document.family_member_id == member_id,
        Document.is_deleted == False,
    ).order_by(Document.created_at.desc()).all()
    return [_document_to_dict(document, analysis) for document, analysis in rows]


@router.get("/documents/available")
async def list_available_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    documents = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.is_deleted == False,
        Document.family_member_id == None,
    ).order_by(Document.created_at.desc()).limit(50).all()
    return [_document_to_dict(document) for document in documents]


@router.post("/members/{member_id}/documents/{document_id}")
async def link_family_document(
    member_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    _member_or_404(db, current_user.id, member_id)
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
        Document.is_deleted == False,
    ).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Belge bulunamadı.")
    document.family_member_id = member_id
    db.commit()
    db.refresh(document)
    return _document_to_dict(document)


@router.delete("/members/{member_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_family_document(
    member_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    _member_or_404(db, current_user.id, member_id)
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
        Document.family_member_id == member_id,
        Document.is_deleted == False,
    ).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bağlı belge bulunamadı.")
    document.family_member_id = None
    db.commit()
    return None


@router.post("/invitations", status_code=status.HTTP_201_CREATED)
async def create_family_invitation(
    payload: FamilyInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    invitee_email = payload.invitee_email.lower()
    if invitee_email == current_user.email.lower():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kendinize aile daveti gönderemezsiniz.")

    if payload.family_member_id:
        _member_or_404(db, current_user.id, payload.family_member_id)

    existing = db.query(FamilyInvitation).filter(
        FamilyInvitation.inviter_user_id == current_user.id,
        FamilyInvitation.invitee_email == invitee_email,
        FamilyInvitation.status == "pending",
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu e-posta için bekleyen bir davet zaten var.")

    invitation = FamilyInvitation(
        inviter_user_id=current_user.id,
        family_member_id=payload.family_member_id,
        invitee_email=invitee_email,
        relation=payload.relation.strip(),
        token=secrets.token_urlsafe(32),
        can_view_documents=payload.can_view_documents,
        can_add_records=payload.can_add_records,
        can_edit_records=payload.can_edit_records,
        can_generate_reports=payload.can_generate_reports,
        message=payload.message,
        expires_at=datetime.utcnow() + timedelta(days=14),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    # Davet edilen kullanıcı sistemde kayıtlıysa push + notification event gönder
    invitee = db.query(User).filter(User.email == invitee_email).first()
    if invitee:
        try:
            from app.services.push_service import emit_notification_event

            emit_notification_event(
                db,
                user_id=invitee.id,
                event_type="family_invitation",
                title="Aile daveti aldın",
                body=f"{current_user.full_name or current_user.email} seni aile takibine davet etti.",
                route="/family/invitations",
                priority="important",
            )
            db.commit()
        except Exception:
            pass

    return _invitation_to_dict(invitation, current_user)


@router.get("/invitations/sent")
async def list_sent_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    invitations = db.query(FamilyInvitation).filter(
        FamilyInvitation.inviter_user_id == current_user.id,
    ).order_by(FamilyInvitation.created_at.desc()).all()
    return [_invitation_to_dict(invitation, current_user) for invitation in invitations]


@router.get("/invitations/received")
async def list_received_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitations = db.query(FamilyInvitation).filter(
        FamilyInvitation.invitee_email == current_user.email.lower(),
        FamilyInvitation.status == "pending",
    ).order_by(FamilyInvitation.created_at.desc()).all()
    inviter_ids = {invitation.inviter_user_id for invitation in invitations}
    inviters = {
        user.id: user
        for user in db.query(User).filter(User.id.in_(inviter_ids)).all()
    } if inviter_ids else {}
    return [_invitation_to_dict(invitation, inviters.get(invitation.inviter_user_id)) for invitation in invitations]


@router.post("/invitations/{token}/accept")
async def accept_family_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = db.query(FamilyInvitation).filter(FamilyInvitation.token == token).first()
    if not invitation or invitation.status != "pending":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Geçerli davet bulunamadı.")
    if invitation.invitee_email != current_user.email.lower():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu davet bu kullanıcıya ait değil.")
    if invitation.expires_at and invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Davetin süresi dolmuş.")

    access = db.query(FamilyAccess).filter(
        FamilyAccess.owner_user_id == current_user.id,
        FamilyAccess.watcher_user_id == invitation.inviter_user_id,
        FamilyAccess.is_active == True,
    ).first()
    if not access:
        access = FamilyAccess(
            owner_user_id=current_user.id,
            watcher_user_id=invitation.inviter_user_id,
            invitation_id=invitation.id,
            family_member_id=invitation.family_member_id,
            relation=invitation.relation,
            can_view_documents=invitation.can_view_documents,
            can_add_records=invitation.can_add_records,
            can_edit_records=invitation.can_edit_records,
            can_generate_reports=invitation.can_generate_reports,
        )
        db.add(access)
    else:
        access.invitation_id = invitation.id
        access.family_member_id = invitation.family_member_id
        access.relation = invitation.relation
        access.can_view_documents = invitation.can_view_documents
        access.can_add_records = invitation.can_add_records
        access.can_edit_records = invitation.can_edit_records
        access.can_generate_reports = invitation.can_generate_reports
        access.updated_at = datetime.utcnow()

    if invitation.family_member_id:
        member = db.query(FamilyMember).filter(
            FamilyMember.id == invitation.family_member_id,
            FamilyMember.user_id == invitation.inviter_user_id,
        ).first()
        if member:
            member.linked_user_id = current_user.id
            member.updated_at = datetime.utcnow()
            access.family_member_id = member.id
    else:
        member = _ensure_family_member_for_access(db, access, current_user)

    invitation.status = "accepted"
    invitation.accepted_at = datetime.utcnow()
    invitation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(access)

    inviter = db.query(User).filter(User.id == invitation.inviter_user_id).first()
    member = db.query(FamilyMember).filter(FamilyMember.id == access.family_member_id).first() if access.family_member_id else None
    return _access_to_dict(access, current_user, member) | {"watcher_name": inviter.full_name if inviter else None}


@router.post("/invitations/{token}/decline")
async def decline_family_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = db.query(FamilyInvitation).filter(FamilyInvitation.token == token).first()
    if not invitation or invitation.status != "pending":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Geçerli davet bulunamadı.")
    if invitation.invitee_email != current_user.email.lower():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu davet bu kullanıcıya ait değil.")
    invitation.status = "declined"
    invitation.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "declined"}


@router.post("/invitations/{invitation_id}/cancel")
async def cancel_family_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    invitation = db.query(FamilyInvitation).filter(
        FamilyInvitation.id == invitation_id,
        FamilyInvitation.inviter_user_id == current_user.id,
    ).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Davet bulunamadı.")
    if invitation.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sadece bekleyen davet iptal edilebilir.")
    invitation.status = "cancelled"
    invitation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(invitation)
    return _invitation_to_dict(invitation, current_user)


@router.get("/shared-accesses")
async def list_shared_accesses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    accesses = db.query(FamilyAccess).filter(
        FamilyAccess.watcher_user_id == current_user.id,
        FamilyAccess.is_active == True,
    ).order_by(FamilyAccess.created_at.desc()).all()
    owner_ids = {access.owner_user_id for access in accesses}
    member_ids = {access.family_member_id for access in accesses if access.family_member_id}
    owners = {user.id: user for user in db.query(User).filter(User.id.in_(owner_ids)).all()} if owner_ids else {}
    members = {member.id: member for member in db.query(FamilyMember).filter(FamilyMember.id.in_(member_ids)).all()} if member_ids else {}
    return [_access_to_dict(access, owners.get(access.owner_user_id), members.get(access.family_member_id)) for access in accesses]


@router.get("/shared-accesses/{access_id}/summary")
async def get_shared_access_summary(
    access_id: int,
    target_date: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    access = _access_or_404(db, current_user.id, access_id)
    owner = db.query(User).filter(User.id == access.owner_user_id).first()
    member = db.query(FamilyMember).filter(FamilyMember.id == access.family_member_id).first() if access.family_member_id else None
    summary = _health_summary(db, access.owner_user_id, target_date)

    documents = []
    if access.can_view_documents:
        rows = db.query(Document, AIAnalysis).outerjoin(
            AIAnalysis,
            AIAnalysis.document_id == Document.id,
        ).filter(
            Document.user_id == access.owner_user_id,
            Document.is_deleted == False,
        ).order_by(Document.created_at.desc()).limit(20).all()
        documents = [_document_to_dict(document, analysis) for document, analysis in rows]

    return {
        "access": _access_to_dict(access, owner, member),
        "health": summary,
        "documents": documents,
    }


@router.post("/shared-accesses/{access_id}/records", status_code=status.HTTP_201_CREATED)
async def create_shared_record(
    access_id: int,
    payload: SharedRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    access = _access_or_404(db, current_user.id, access_id)
    if not access.can_add_records:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu aile erişiminde kayıt ekleme izni yok.")

    if payload.category == "symptom":
        record = SymptomLog(
            user_id=access.owner_user_id,
            date=payload.date,
            symptom_name=payload.title,
            severity=payload.severity or 5,
            notes=payload.notes or "Aile takibi üzerinden eklendi.",
        )
    elif payload.category == "medication":
        record = MedicationLog(
            user_id=access.owner_user_id,
            date=payload.date,
            name=payload.title,
            dosage=payload.dosage or "Belirtilmedi",
            time_taken=payload.time_taken,
            notes=payload.notes or "Aile takibi üzerinden eklendi.",
        )
    elif payload.category == "sleep":
        if payload.hours_slept is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uyku kaydı için saat bilgisi gerekli.")
        existing = db.query(SleepLog).filter(SleepLog.user_id == access.owner_user_id, SleepLog.date == payload.date).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu tarih için uyku kaydı zaten var.")
        record = SleepLog(
            user_id=access.owner_user_id,
            date=payload.date,
            hours_slept=payload.hours_slept,
            quality=payload.quality or "good",
            notes=payload.notes or "Aile takibi üzerinden eklendi.",
        )
    elif payload.category == "nutrition":
        record = NutritionLog(
            user_id=access.owner_user_id,
            date=payload.date,
            meal_type=payload.meal_type or "snack",
            water_ml=payload.water_ml or 0,
            notes=payload.notes or payload.title,
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Gerçek kullanıcı kaydı için kategori desteklenmiyor.")

    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "category": payload.category, "owner_user_id": access.owner_user_id}


@router.patch("/shared-accesses/{access_id}/records/{category}/{record_id}")
async def update_shared_record(
    access_id: int,
    category: str,
    record_id: int,
    payload: SharedRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    access = _access_or_404(db, current_user.id, access_id)
    if not access.can_edit_records:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu aile erişiminde kayıt düzenleme izni yok.")

    record = _shared_record_or_404(db, access.owner_user_id, category, record_id)
    data = payload.model_dump(exclude_unset=True)

    if category == "symptom":
        if "title" in data and data["title"] is not None:
            record.symptom_name = data["title"]
        if "severity" in data and data["severity"] is not None:
            record.severity = data["severity"]
        if "notes" in data:
            record.notes = data["notes"]
    elif category == "medication":
        if "title" in data and data["title"] is not None:
            record.name = data["title"]
        if "dosage" in data and data["dosage"] is not None:
            record.dosage = data["dosage"]
        if "time_taken" in data:
            record.time_taken = data["time_taken"]
        if "notes" in data:
            record.notes = data["notes"]
    elif category == "sleep":
        if "hours_slept" in data and data["hours_slept"] is not None:
            record.hours_slept = data["hours_slept"]
        if "quality" in data and data["quality"] is not None:
            record.quality = data["quality"]
        if "notes" in data:
            record.notes = data["notes"]
    elif category == "nutrition":
        if "meal_type" in data and data["meal_type"] is not None:
            record.meal_type = data["meal_type"]
        if "water_ml" in data and data["water_ml"] is not None:
            record.water_ml = data["water_ml"]
        if "notes" in data:
            record.notes = data["notes"]

    db.commit()
    db.refresh(record)
    return {"id": record.id, "category": category, "owner_user_id": access.owner_user_id}


@router.delete("/shared-accesses/{access_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_shared_access_as_watcher(
    access_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_premium(current_user)
    access = _access_or_404(db, current_user.id, access_id)
    access.is_active = False
    access.updated_at = datetime.utcnow()
    db.commit()
    return None
