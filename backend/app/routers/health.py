from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="Sistem sağlık kontrolü")
async def health_check():
    """Sistemin çalışır durumda olup olmadığını kontrol eder."""
    return {
        "durum": "çalışıyor",
        "servis": "TanıLog API",
        "mesaj": "Sistem sağlıklı çalışmaktadır.",
    }
