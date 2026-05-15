"""admin and legal fields

Revision ID: 6c4d2e9f1a22
Revises: f3a9d8c2b611
Create Date: 2026-05-15 21:50:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "6c4d2e9f1a22"
down_revision: Union[str, None] = "f3a9d8c2b611"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("terms_accepted_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("privacy_accepted_at", sa.DateTime(), nullable=True))
    op.alter_column("users", "is_admin", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "privacy_accepted_at")
    op.drop_column("users", "terms_accepted_at")
    op.drop_column("users", "is_admin")
