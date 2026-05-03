import os
import shutil
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.routers.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg"
]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(...),
    notes: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Free tier control (aylık 3 belge sınırı) - TEST İÇİN KALDIRILDI
    # if not current_user.is_premium:
    #     current_month = datetime.utcnow().month
    #     current_year = datetime.utcnow().year
    #     
    #     doc_count = db.query(Document).filter(
    #         Document.user_id == current_user.id,
    #         extract('month', Document.created_at) == current_month,
    #         extract('year', Document.created_at) == current_year
    #     ).count()
    #     
    #     if doc_count >= 3:
    #         raise HTTPException(
    #             status_code=403, 
    #             detail="Aylık ücretsiz yükleme limitine (3 belge) ulaştınız. Sınırsız yükleme için Premium'a geçin."
    #         )

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Sadece PDF, JPG ve PNG formatları desteklenmektedir.")

    # Read and check size
    file_bytes = await file.read()
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Dosya boyutu 5MB'ı geçemez.")
    
    await file.seek(0) # Reset pointer

    # Save physical file
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create DB record
    db_doc = Document(
        user_id=current_user.id,
        original_filename=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=file_size,
        category=category,
        notes=notes
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    return db_doc


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    category: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.is_deleted == False
    )
    if category:
        query = query.filter(Document.category == category)
    return query.order_by(Document.created_at.desc()).all()


@router.get("/{doc_id}/file")
async def get_document_file(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Dosya sunucuda bulunamadı")

    return FileResponse(doc.file_path, media_type=doc.file_type, filename=doc.original_filename)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == doc_id, 
        Document.user_id == current_user.id,
        Document.is_deleted == False
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    # Sadece fiziksel dosyayı sil, veritabanında kaydı limit kontrolü için tut (Soft delete)
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            print(f"Error deleting file: {e}")

    # Soft delete
    doc.is_deleted = True
    db.commit()

from app.models.ai_analysis import AIAnalysis
from app.services.ai_service import analyze_medical_document

@router.post("/{doc_id}/analyze")
async def analyze_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == doc_id, 
        Document.user_id == current_user.id,
        Document.is_deleted == False
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
        
    # Zaten analiz edilmiş mi?
    existing_analysis = db.query(AIAnalysis).filter(AIAnalysis.document_id == doc.id).first()
    if existing_analysis:
        return existing_analysis
        
    # Free tier control (günlük 1 analiz sınırı) - TEST İÇİN KALDIRILDI
    # if not current_user.is_premium:
    #     today = datetime.utcnow().date()
    #     daily_count = db.query(AIAnalysis).join(Document).filter(
    #         Document.user_id == current_user.id,
    #         extract('year', AIAnalysis.created_at) == today.year,
    #         extract('month', AIAnalysis.created_at) == today.month,
    #         extract('day', AIAnalysis.created_at) == today.day
    #     ).count()
    #     
    #     if daily_count >= 1:
    #         raise HTTPException(
    #             status_code=403, 
    #             detail="Günlük ücretsiz yapay zeka analiz limitine (1 adet) ulaştınız. Sınırsız analiz için Premium'a geçin."
    #         )
            
    # AI servisi çağır
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Fiziksel belge bulunamadı")
        
    ai_result = analyze_medical_document(doc.file_path, doc.file_type)
    
    # DB'ye kaydet
    db_analysis = AIAnalysis(
        document_id=doc.id,
        summary=ai_result.get("summary", "Özet alınamadı."),
        critical_findings=ai_result.get("critical_findings"),
        full_analysis=ai_result.get("full_analysis", "Detaylı analiz alınamadı."),
        has_critical_alert=ai_result.get("has_critical_alert", False)
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    
    return db_analysis


@router.get("/{doc_id}/analysis")
async def get_document_analysis(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
        
    analysis = db.query(AIAnalysis).filter(AIAnalysis.document_id == doc.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Bu belge için henüz yapay zeka analizi yapılmamış")
        
    return analysis

