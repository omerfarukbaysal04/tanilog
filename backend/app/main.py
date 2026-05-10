from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import ai, auth, chat, health, health_tracking, documents, voice

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
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Router'ları kaydet
app.include_router(health.router, tags=["Sistem"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Kimlik Doğrulama"])
app.include_router(health_tracking.router, prefix="/api/v1/health", tags=["Sağlık Takibi"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Belgeler"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["Yapay Zeka"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["Sesli Asistan"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Premium AI Chatbot"])


@app.get("/", tags=["Kök"])
async def root():
    """API kök endpoint'i."""
    return {
        "uygulama": settings.APP_NAME,
        "versiyon": settings.APP_VERSION,
        "slogan": "Sağlığını anla, hayatını yönet.",
        "dokümantasyon": "/docs",
    }
