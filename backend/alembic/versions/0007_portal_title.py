"""app_settings: portal title/subtitle

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-08
"""
import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("app_settings", sa.Column("portal_title", sa.String(100), nullable=True))
    op.add_column("app_settings", sa.Column("portal_subtitle", sa.String(200), nullable=True))


def downgrade():
    op.drop_column("app_settings", "portal_subtitle")
    op.drop_column("app_settings", "portal_title")
