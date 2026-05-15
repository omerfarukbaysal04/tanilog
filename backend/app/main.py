import logging
import os
import time

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import admin, ai, auth, billing, chat, dashboard, family, health, health_tracking, documents, settings as settings_router, voice
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
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["Ayarlar"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


@app.on_event("startup")
async def startup_checks():
    validate_runtime_security()


@app.get("/", tags=["Kök"])
async def root():
    """API kök endpoint'i."""
    return {
        "uygulama": settings.APP_NAME,
        "versiyon": settings.APP_VERSION,
        "slogan": "Sağlığını anla, hayatını yönet.",
        "dokümantasyon": "/docs",
    }
