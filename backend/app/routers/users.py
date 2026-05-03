"""Kullanıcı yardımcı fonksiyonları ve premium kontrol."""

from datetime import datetime

from app.models.user import User


def is_premium_active(user: User) -> bool:
    """Kullanıcının premium aboneliğinin aktif olup olmadığını kontrol eder."""
    if not user.is_premium:
        return False
    if user.premium_until is None:
        return False
    return user.premium_until > datetime.utcnow()


def get_user_plan_display(user: User) -> str:
    """Kullanıcının plan bilgisini okunabilir formatta döner."""
    plan_labels = {
        "free": "Ücretsiz",
        "monthly": "Premium Aylık",
        "yearly": "Premium Yıllık",
    }
    return plan_labels.get(user.subscription_plan, "Ücretsiz")


def get_daily_limit(user: User, feature: str) -> int:
    """
    Kullanıcının günlük kullanım limitini döner.
    Premium kullanıcılar için sınırsız (-1).
    """
    free_limits = {
        "ai_analysis": 1,
        "voice_input": 3,
        "document_upload_monthly": 3,
        "medication_reminder": 3,
    }

    if is_premium_active(user):
        return -1  # Sınırsız

    return free_limits.get(feature, 0)
