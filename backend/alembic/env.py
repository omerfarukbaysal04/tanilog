"""Alembic ortam yapılandırması — TanıLog."""

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# Proje kök dizinini sys.path'e ekle
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings  # noqa: E402
from app.database import Base  # noqa: E402

# Tüm modelleri import et (Alembic'in metadata'yı görmesi için)
from app.models.user import User  # noqa: E402, F401
from app.models.health import SymptomLog, MedicationLog, SleepLog, NutritionLog  # noqa: E402, F401

# Alembic Config nesnesi
config = context.config

# Logging yapılandırması
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# SQLAlchemy URL'yi uygulama ayarlarından al
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Metadata — autogenerate desteği için
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Offline modda migration çalıştır (SQL üret)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Online modda migration çalıştır (veritabanına bağlan)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
