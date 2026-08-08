"""case total_amount (admin-set trámite total)

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-08
"""
import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("cases", sa.Column("total_amount", sa.Numeric(10, 2), nullable=True))


def downgrade():
    op.drop_column("cases", "total_amount")
