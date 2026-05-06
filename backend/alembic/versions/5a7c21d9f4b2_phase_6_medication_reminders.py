"""Phase 6 medication reminders

Revision ID: 5a7c21d9f4b2
Revises: 8e5f8a2e1fa4
Create Date: 2026-05-06 10:45:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5a7c21d9f4b2"
down_revision: Union[str, None] = "8e5f8a2e1fa4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("medication_logs", sa.Column("reminder_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("medication_logs", sa.Column("reminder_time", sa.Time(), nullable=True))
    op.add_column("medication_logs", sa.Column("is_taken", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("medication_logs", sa.Column("taken_at", sa.DateTime(), nullable=True))
    op.alter_column("medication_logs", "reminder_enabled", server_default=None)
    op.alter_column("medication_logs", "is_taken", server_default=None)


def downgrade() -> None:
    op.drop_column("medication_logs", "taken_at")
    op.drop_column("medication_logs", "is_taken")
    op.drop_column("medication_logs", "reminder_time")
    op.drop_column("medication_logs", "reminder_enabled")
