"""Settings and health profile

Revision ID: f3a9d8c2b611
Revises: e8b72f0c4d11
Create Date: 2026-05-11 23:05:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3a9d8c2b611"
down_revision: Union[str, None] = "e8b72f0c4d11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("notifications_enabled", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("users", sa.Column("voice_notifications_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("medication_reminders_enabled", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("users", sa.Column("family_invite_notifications_enabled", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("users", sa.Column("quiet_hours_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("quiet_hours_start", sa.String(length=5), nullable=True))
    op.add_column("users", sa.Column("quiet_hours_end", sa.String(length=5), nullable=True))
    op.add_column("users", sa.Column("ai_use_health_records", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("users", sa.Column("ai_use_documents", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("users", sa.Column("ai_use_doctor_reports", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("users", sa.Column("ai_use_profile", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("users", sa.Column("birth_year", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("biological_sex", sa.String(length=30), nullable=True))
    op.add_column("users", sa.Column("height_cm", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("weight_kg", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("blood_type", sa.String(length=10), nullable=True))
    op.add_column("users", sa.Column("chronic_conditions", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("allergies", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("emergency_contact_name", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("emergency_contact_phone", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "emergency_contact_phone")
    op.drop_column("users", "emergency_contact_name")
    op.drop_column("users", "allergies")
    op.drop_column("users", "chronic_conditions")
    op.drop_column("users", "blood_type")
    op.drop_column("users", "weight_kg")
    op.drop_column("users", "height_cm")
    op.drop_column("users", "biological_sex")
    op.drop_column("users", "birth_year")
    op.drop_column("users", "ai_use_profile")
    op.drop_column("users", "ai_use_doctor_reports")
    op.drop_column("users", "ai_use_documents")
    op.drop_column("users", "ai_use_health_records")
    op.drop_column("users", "quiet_hours_end")
    op.drop_column("users", "quiet_hours_start")
    op.drop_column("users", "quiet_hours_enabled")
    op.drop_column("users", "family_invite_notifications_enabled")
    op.drop_column("users", "medication_reminders_enabled")
    op.drop_column("users", "voice_notifications_enabled")
    op.drop_column("users", "notifications_enabled")
