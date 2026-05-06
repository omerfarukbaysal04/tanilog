"""Medication AI details

Revision ID: 7c1d2a9b8f31
Revises: 5a7c21d9f4b2
Create Date: 2026-05-06 12:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7c1d2a9b8f31"
down_revision: Union[str, None] = "5a7c21d9f4b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("medication_logs", sa.Column("image_data_url", sa.Text(), nullable=True))
    op.add_column("medication_logs", sa.Column("ai_scan_summary", sa.Text(), nullable=True))
    op.add_column("medication_logs", sa.Column("ai_scan_details", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("medication_logs", "ai_scan_details")
    op.drop_column("medication_logs", "ai_scan_summary")
    op.drop_column("medication_logs", "image_data_url")
