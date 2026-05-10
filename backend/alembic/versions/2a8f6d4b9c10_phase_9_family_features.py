"""phase 9 family features

Revision ID: 2a8f6d4b9c10
Revises: c42d91b7e8a0
Create Date: 2026-05-10 22:35:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "2a8f6d4b9c10"
down_revision: Union[str, None] = "c42d91b7e8a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "family_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("relation", sa.String(length=80), nullable=False),
        sa.Column("birth_year", sa.Integer(), nullable=True),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("emergency_contact", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_family_members_id"), "family_members", ["id"], unique=False)
    op.create_index(op.f("ix_family_members_user_id"), "family_members", ["user_id"], unique=False)

    op.create_table(
        "family_health_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("family_member_id", sa.Integer(), nullable=False),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("severity", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="note"),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["family_member_id"], ["family_members.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_family_health_entries_id"), "family_health_entries", ["id"], unique=False)
    op.create_index(op.f("ix_family_health_entries_user_id"), "family_health_entries", ["user_id"], unique=False)
    op.create_index(
        op.f("ix_family_health_entries_family_member_id"),
        "family_health_entries",
        ["family_member_id"],
        unique=False,
    )
    op.create_index(op.f("ix_family_health_entries_entry_date"), "family_health_entries", ["entry_date"], unique=False)

    op.add_column("documents", sa.Column("family_member_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_documents_family_member_id"), "documents", ["family_member_id"], unique=False)
    op.create_foreign_key(
        "fk_documents_family_member_id_family_members",
        "documents",
        "family_members",
        ["family_member_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_documents_family_member_id_family_members", "documents", type_="foreignkey")
    op.drop_index(op.f("ix_documents_family_member_id"), table_name="documents")
    op.drop_column("documents", "family_member_id")

    op.drop_index(op.f("ix_family_health_entries_entry_date"), table_name="family_health_entries")
    op.drop_index(op.f("ix_family_health_entries_family_member_id"), table_name="family_health_entries")
    op.drop_index(op.f("ix_family_health_entries_user_id"), table_name="family_health_entries")
    op.drop_index(op.f("ix_family_health_entries_id"), table_name="family_health_entries")
    op.drop_table("family_health_entries")

    op.drop_index(op.f("ix_family_members_user_id"), table_name="family_members")
    op.drop_index(op.f("ix_family_members_id"), table_name="family_members")
    op.drop_table("family_members")
