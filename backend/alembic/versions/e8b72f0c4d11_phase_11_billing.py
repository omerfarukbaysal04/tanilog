"""Phase 11 billing and premium plan events

Revision ID: e8b72f0c4d11
Revises: 4f3d2a1c9b77
Create Date: 2026-05-11 21:45:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8b72f0c4d11"
down_revision: Union[str, None] = "4f3d2a1c9b77"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "subscription_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("plan", sa.String(length=20), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("provider_session_id", sa.String(length=120), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("currency", sa.String(length=10), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_subscription_events_id"), "subscription_events", ["id"], unique=False)
    op.create_index(op.f("ix_subscription_events_provider_session_id"), "subscription_events", ["provider_session_id"], unique=False)
    op.create_index(op.f("ix_subscription_events_user_id"), "subscription_events", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_subscription_events_user_id"), table_name="subscription_events")
    op.drop_index(op.f("ix_subscription_events_provider_session_id"), table_name="subscription_events")
    op.drop_index(op.f("ix_subscription_events_id"), table_name="subscription_events")
    op.drop_table("subscription_events")
