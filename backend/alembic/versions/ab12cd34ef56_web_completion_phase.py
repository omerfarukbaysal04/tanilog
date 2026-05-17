"""Web completion phase

Revision ID: ab12cd34ef56
Revises: 6c4d2e9f1a22
Create Date: 2026-05-17 23:55:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ab12cd34ef56"
down_revision: Union[str, None] = "6c4d2e9f1a22"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("family_invitations", sa.Column("can_generate_reports", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("family_accesses", sa.Column("can_generate_reports", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("p256dh", sa.Text(), nullable=False),
        sa.Column("auth", sa.Text(), nullable=False),
        sa.Column("user_agent", sa.String(length=500), nullable=True),
        sa.Column("provider", sa.String(length=30), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("endpoint"),
    )
    op.create_index(op.f("ix_push_subscriptions_id"), "push_subscriptions", ["id"], unique=False)
    op.create_index(op.f("ix_push_subscriptions_user_id"), "push_subscriptions", ["user_id"], unique=False)

    op.create_table(
        "notification_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=60), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("route", sa.String(length=255), nullable=True),
        sa.Column("priority", sa.String(length=30), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column("delivered_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notification_events_created_at"), "notification_events", ["created_at"], unique=False)
    op.create_index(op.f("ix_notification_events_event_type"), "notification_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_notification_events_id"), "notification_events", ["id"], unique=False)
    op.create_index(op.f("ix_notification_events_user_id"), "notification_events", ["user_id"], unique=False)

    op.create_table(
        "doctor_share_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("report_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("view_count", sa.Integer(), nullable=False),
        sa.Column("last_viewed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["report_id"], ["doctor_prep_reports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_doctor_share_links_expires_at"), "doctor_share_links", ["expires_at"], unique=False)
    op.create_index(op.f("ix_doctor_share_links_id"), "doctor_share_links", ["id"], unique=False)
    op.create_index(op.f("ix_doctor_share_links_report_id"), "doctor_share_links", ["report_id"], unique=False)
    op.create_index(op.f("ix_doctor_share_links_token_hash"), "doctor_share_links", ["token_hash"], unique=True)
    op.create_index(op.f("ix_doctor_share_links_user_id"), "doctor_share_links", ["user_id"], unique=False)

    op.create_table(
        "risk_alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rule_key", sa.String(length=80), nullable=False),
        sa.Column("severity", sa.String(length=30), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column("route", sa.String(length=255), nullable=True),
        sa.Column("is_dismissed", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_risk_alerts_created_at"), "risk_alerts", ["created_at"], unique=False)
    op.create_index(op.f("ix_risk_alerts_id"), "risk_alerts", ["id"], unique=False)
    op.create_index(op.f("ix_risk_alerts_rule_key"), "risk_alerts", ["rule_key"], unique=False)
    op.create_index(op.f("ix_risk_alerts_user_id"), "risk_alerts", ["user_id"], unique=False)

    op.create_table(
        "onboarding_states",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("health_profile_done", sa.Boolean(), nullable=False),
        sa.Column("notifications_done", sa.Boolean(), nullable=False),
        sa.Column("first_record_done", sa.Boolean(), nullable=False),
        sa.Column("first_document_done", sa.Boolean(), nullable=False),
        sa.Column("ai_permissions_done", sa.Boolean(), nullable=False),
        sa.Column("skipped", sa.Boolean(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_onboarding_states_id"), "onboarding_states", ["id"], unique=False)
    op.create_index(op.f("ix_onboarding_states_user_id"), "onboarding_states", ["user_id"], unique=True)

    op.create_table(
        "admin_audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("admin_user_id", sa.Integer(), nullable=True),
        sa.Column("target_user_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("before", sa.Text(), nullable=True),
        sa.Column("after", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["admin_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_admin_audit_logs_action"), "admin_audit_logs", ["action"], unique=False)
    op.create_index(op.f("ix_admin_audit_logs_admin_user_id"), "admin_audit_logs", ["admin_user_id"], unique=False)
    op.create_index(op.f("ix_admin_audit_logs_created_at"), "admin_audit_logs", ["created_at"], unique=False)
    op.create_index(op.f("ix_admin_audit_logs_id"), "admin_audit_logs", ["id"], unique=False)
    op.create_index(op.f("ix_admin_audit_logs_target_user_id"), "admin_audit_logs", ["target_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_admin_audit_logs_target_user_id"), table_name="admin_audit_logs")
    op.drop_index(op.f("ix_admin_audit_logs_id"), table_name="admin_audit_logs")
    op.drop_index(op.f("ix_admin_audit_logs_created_at"), table_name="admin_audit_logs")
    op.drop_index(op.f("ix_admin_audit_logs_admin_user_id"), table_name="admin_audit_logs")
    op.drop_index(op.f("ix_admin_audit_logs_action"), table_name="admin_audit_logs")
    op.drop_table("admin_audit_logs")
    op.drop_index(op.f("ix_onboarding_states_user_id"), table_name="onboarding_states")
    op.drop_index(op.f("ix_onboarding_states_id"), table_name="onboarding_states")
    op.drop_table("onboarding_states")
    op.drop_index(op.f("ix_risk_alerts_user_id"), table_name="risk_alerts")
    op.drop_index(op.f("ix_risk_alerts_rule_key"), table_name="risk_alerts")
    op.drop_index(op.f("ix_risk_alerts_id"), table_name="risk_alerts")
    op.drop_index(op.f("ix_risk_alerts_created_at"), table_name="risk_alerts")
    op.drop_table("risk_alerts")
    op.drop_index(op.f("ix_doctor_share_links_user_id"), table_name="doctor_share_links")
    op.drop_index(op.f("ix_doctor_share_links_token_hash"), table_name="doctor_share_links")
    op.drop_index(op.f("ix_doctor_share_links_report_id"), table_name="doctor_share_links")
    op.drop_index(op.f("ix_doctor_share_links_id"), table_name="doctor_share_links")
    op.drop_index(op.f("ix_doctor_share_links_expires_at"), table_name="doctor_share_links")
    op.drop_table("doctor_share_links")
    op.drop_index(op.f("ix_notification_events_user_id"), table_name="notification_events")
    op.drop_index(op.f("ix_notification_events_id"), table_name="notification_events")
    op.drop_index(op.f("ix_notification_events_event_type"), table_name="notification_events")
    op.drop_index(op.f("ix_notification_events_created_at"), table_name="notification_events")
    op.drop_table("notification_events")
    op.drop_index(op.f("ix_push_subscriptions_user_id"), table_name="push_subscriptions")
    op.drop_index(op.f("ix_push_subscriptions_id"), table_name="push_subscriptions")
    op.drop_table("push_subscriptions")
    op.drop_column("family_accesses", "can_generate_reports")
    op.drop_column("family_invitations", "can_generate_reports")
