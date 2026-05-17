import logging
import os
import time
import asyncio
from datetime import date, datetime

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import SessionLocal
from app.models.health import MedicationLog
from app.models.web_completion import NotificationEvent
from app.routers import admin, ai, auth, billing, chat, dashboard, family, health, health_tracking, documents, notifications, onboarding, push, risk_alerts, search, settings as settings_router, timeline, voice
from app.security import validate_runtime_security

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("tanilog.api")

# FastAPI uygulaması
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="TanıLog - Yapay zeka destekli kişisel sağlık takip platformu. "
                "Sağlığını anla, hayatını yönet.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.exception("request_failed method=%s path=%s duration_ms=%.2f", request.method, request.url.path, elapsed_ms)
        raise

    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "request method=%s path=%s status=%s duration_ms=%.2f",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response

# Router'ları kaydet
app.include_router(health.router, tags=["Sistem"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Kimlik Doğrulama"])
app.include_router(health_tracking.router, prefix="/api/v1/health", tags=["Sağlık Takibi"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Belgeler"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["Yapay Zeka"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["Sesli Asistan"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Premium AI Chatbot"])
app.include_router(family.router, prefix="/api/v1/family", tags=["Aile Takibi"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["Odeme ve Premium"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Arama"])
app.include_router(timeline.router, prefix="/api/v1/timeline", tags=["Zaman Çizelgesi"])
app.include_router(risk_alerts.router, prefix="/api/v1/risk-alerts", tags=["Risk Uyarıları"])
app.include_router(onboarding.router, prefix="/api/v1/onboarding", tags=["Onboarding"])
app.include_router(push.router, prefix="/api/v1/push", tags=["Web Push"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Bildirimler"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["Ayarlar"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


@app.on_event("startup")
async def startup_checks():
    validate_runtime_security()
    asyncio.create_task(reminder_event_loop())


async def reminder_event_loop():
    while True:
        try:
            db = SessionLocal()
            today = date.today()
            now_text = datetime.now().strftime("%H:%M")
            medications = db.query(MedicationLog).filter(
                MedicationLog.date == today,
                MedicationLog.reminder_enabled.is_(True),
                MedicationLog.is_taken.is_(False),
            ).all()
            for item in medications:
                if not item.reminder_time or item.reminder_time.strftime("%H:%M") != now_text:
                    continue
                event_key = f"medication_reminder:{item.id}:{today}:{now_text}"
                exists = db.query(NotificationEvent).filter(
                    NotificationEvent.user_id == item.user_id,
                    NotificationEvent.event_type == event_key,
                ).first()
                if exists:
                    continue
                db.add(NotificationEvent(
                    user_id=item.user_id,
                    event_type=event_key,
                    title="İlaç hatırlatma",
                    body=f"{item.name} ({item.dosage}) alma zamanı: {now_text}",
                    route="/health?tab=medications",
                    priority="important",
                ))
            db.commit()
        except Exception:
            logger.exception("reminder_loop_failed")
        finally:
            try:
                db.close()
            except Exception:
                pass
        await asyncio.sleep(60)


@app.get("/", tags=["Kök"])
async def root():
    """API kök endpoint'i."""
    return {
        "uygulama": settings.APP_NAME,
        "versiyon": settings.APP_VERSION,
        "slogan": "Sağlığını anla, hayatını yönet.",
        "dokümantasyon": "/docs",
    }
