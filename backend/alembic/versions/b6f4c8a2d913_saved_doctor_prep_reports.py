"""Saved doctor prep reports

Revision ID: b6f4c8a2d913
Revises: 9d3f0a6b2c14
Create Date: 2026-05-09 22:05:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b6f4c8a2d913"
down_revision: Union[str, None] = "9d3f0a6b2c14"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "doctor_prep_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("report_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_doctor_prep_reports_id"), "doctor_prep_reports", ["id"], unique=False)
    op.create_index(op.f("ix_doctor_prep_reports_user_id"), "doctor_prep_reports", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_doctor_prep_reports_user_id"), table_name="doctor_prep_reports")
    op.drop_index(op.f("ix_doctor_prep_reports_id"), table_name="doctor_prep_reports")
    op.drop_table("doctor_prep_reports")
