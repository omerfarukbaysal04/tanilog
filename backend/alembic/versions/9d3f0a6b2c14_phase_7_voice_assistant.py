"""Phase 7 voice assistant

Revision ID: 9d3f0a6b2c14
Revises: 7c1d2a9b8f31
Create Date: 2026-05-09 14:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9d3f0a6b2c14"
down_revision: Union[str, None] = "7c1d2a9b8f31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "voice_usage_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "date", name="uq_voice_usage_user_date"),
    )
    op.create_index(op.f("ix_voice_usage_logs_id"), "voice_usage_logs", ["id"], unique=False)
    op.create_index(op.f("ix_voice_usage_logs_date"), "voice_usage_logs", ["date"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_voice_usage_logs_date"), table_name="voice_usage_logs")
    op.drop_index(op.f("ix_voice_usage_logs_id"), table_name="voice_usage_logs")
    op.drop_table("voice_usage_logs")
