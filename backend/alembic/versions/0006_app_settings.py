"""app_settings (admin-editable branding: logo + color)

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-08
"""
import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "app_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("brand_color", sa.String(7), nullable=True),
        sa.Column("logo_path", sa.String(500), nullable=True),
        sa.Column("logo_file_name", sa.String(255), nullable=True),
    )
    op.execute("INSERT INTO app_settings (id) VALUES (1)")  # single settings row


def downgrade():
    op.drop_table("app_settings")
