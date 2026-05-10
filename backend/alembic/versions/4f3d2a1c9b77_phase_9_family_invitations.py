"""phase 9 family invitations

Revision ID: 4f3d2a1c9b77
Revises: 2a8f6d4b9c10
Create Date: 2026-05-10 23:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "4f3d2a1c9b77"
down_revision: Union[str, None] = "2a8f6d4b9c10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("family_members", sa.Column("linked_user_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_family_members_linked_user_id"), "family_members", ["linked_user_id"], unique=False)
    op.create_foreign_key(
        "fk_family_members_linked_user_id_users",
        "family_members",
        "users",
        ["linked_user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "family_invitations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("inviter_user_id", sa.Integer(), nullable=False),
        sa.Column("family_member_id", sa.Integer(), nullable=True),
        sa.Column("invitee_email", sa.String(length=255), nullable=False),
        sa.Column("relation", sa.String(length=80), nullable=False),
        sa.Column("token", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending"),
        sa.Column("can_view_documents", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("can_add_records", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("can_edit_records", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("accepted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["family_member_id"], ["family_members.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["inviter_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index(op.f("ix_family_invitations_id"), "family_invitations", ["id"], unique=False)
    op.create_index(op.f("ix_family_invitations_inviter_user_id"), "family_invitations", ["inviter_user_id"], unique=False)
    op.create_index(op.f("ix_family_invitations_family_member_id"), "family_invitations", ["family_member_id"], unique=False)
    op.create_index(op.f("ix_family_invitations_invitee_email"), "family_invitations", ["invitee_email"], unique=False)
    op.create_index(op.f("ix_family_invitations_token"), "family_invitations", ["token"], unique=True)
    op.create_index(op.f("ix_family_invitations_status"), "family_invitations", ["status"], unique=False)

    op.create_table(
        "family_accesses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_user_id", sa.Integer(), nullable=False),
        sa.Column("watcher_user_id", sa.Integer(), nullable=False),
        sa.Column("invitation_id", sa.Integer(), nullable=True),
        sa.Column("family_member_id", sa.Integer(), nullable=True),
        sa.Column("relation", sa.String(length=80), nullable=False),
        sa.Column("can_view_documents", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("can_add_records", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("can_edit_records", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["family_member_id"], ["family_members.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["invitation_id"], ["family_invitations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["watcher_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_family_accesses_id"), "family_accesses", ["id"], unique=False)
    op.create_index(op.f("ix_family_accesses_owner_user_id"), "family_accesses", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_family_accesses_watcher_user_id"), "family_accesses", ["watcher_user_id"], unique=False)
    op.create_index(op.f("ix_family_accesses_invitation_id"), "family_accesses", ["invitation_id"], unique=False)
    op.create_index(op.f("ix_family_accesses_family_member_id"), "family_accesses", ["family_member_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_family_accesses_family_member_id"), table_name="family_accesses")
    op.drop_index(op.f("ix_family_accesses_invitation_id"), table_name="family_accesses")
    op.drop_index(op.f("ix_family_accesses_watcher_user_id"), table_name="family_accesses")
    op.drop_index(op.f("ix_family_accesses_owner_user_id"), table_name="family_accesses")
    op.drop_index(op.f("ix_family_accesses_id"), table_name="family_accesses")
    op.drop_table("family_accesses")

    op.drop_index(op.f("ix_family_invitations_status"), table_name="family_invitations")
    op.drop_index(op.f("ix_family_invitations_token"), table_name="family_invitations")
    op.drop_index(op.f("ix_family_invitations_invitee_email"), table_name="family_invitations")
    op.drop_index(op.f("ix_family_invitations_family_member_id"), table_name="family_invitations")
    op.drop_index(op.f("ix_family_invitations_inviter_user_id"), table_name="family_invitations")
    op.drop_index(op.f("ix_family_invitations_id"), table_name="family_invitations")
    op.drop_table("family_invitations")

    op.drop_constraint("fk_family_members_linked_user_id_users", "family_members", type_="foreignkey")
    op.drop_index(op.f("ix_family_members_linked_user_id"), table_name="family_members")
    op.drop_column("family_members", "linked_user_id")
