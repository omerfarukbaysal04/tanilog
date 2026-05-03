from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, health, health_tracking

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

# Router'ları kaydet
app.include_router(health.router, tags=["Sistem"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Kimlik Doğrulama"])
app.include_router(health_tracking.router, prefix="/api/v1/health", tags=["Sağlık Takibi"])


@app.get("/", tags=["Kök"])
async def root():
    """API kök endpoint'i."""
    return {
        "uygulama": settings.APP_NAME,
        "versiyon": settings.APP_VERSION,
        "slogan": "Sağlığını anla, hayatını yönet.",
        "dokümantasyon": "/docs",
    }
