"""payments (abonos) table

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-08
"""
import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("cases.id"), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("method", sa.String(50), nullable=True),
        sa.Column("note", sa.String(255), nullable=True),
        sa.Column("receipt_document_id", sa.Integer(), sa.ForeignKey("documents.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table("payments")
