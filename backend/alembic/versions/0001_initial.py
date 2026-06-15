"""initial schema

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00
"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "cases",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("customer_name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(50), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("plate", sa.String(20), nullable=False),
        sa.Column(
            "service_type",
            sa.Enum("RENOVACION_PLACA", "TRASPASO", "REVISADO", "DUPLICADO", name="servicetype"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "NUEVO",
                "PENDIENTE_REVISION",
                "DOCUMENTOS_INCOMPLETOS",
                "EN_PROCESO",
                "FINALIZADO",
                "CANCELADO",
                name="casestatus",
            ),
            nullable=False,
            server_default="NUEVO",
        ),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("alert_sent", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("last_status_update", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("cases.id"), nullable=False),
        sa.Column("document_type", sa.String(100), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table("documents")
    op.drop_table("cases")
    op.execute("DROP TYPE IF EXISTS casestatus")
    op.execute("DROP TYPE IF EXISTS servicetype")
