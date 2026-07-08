"""dynamic service types and fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-27
"""
import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

SEED_TYPES = [
    ("Renovación de placa", "RENOVACION_PLACA"),
    ("Traspaso", "TRASPASO"),
    ("Revisado", "REVISADO"),
    ("Duplicado", "DUPLICADO"),
]

SEED_FIELDS = [
    {"label": "Foto frontal", "field_key": "foto_frontal", "field_type": "file", "sort_order": 0},
    {"label": "Foto lateral", "field_key": "foto_lateral", "field_type": "file", "sort_order": 1},
    {"label": "Registro único", "field_key": "registro_unico", "field_type": "file", "sort_order": 2},
    {"label": "Póliza de seguro", "field_key": "poliza", "field_type": "file", "sort_order": 3},
]


def upgrade():
    op.create_table(
        "service_types",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "service_fields",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("service_type_id", sa.Integer(), sa.ForeignKey("service_types.id"), nullable=False),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("field_key", sa.String(100), nullable=False),
        sa.Column("field_type", sa.String(20), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )

    # Seed the 4 original service types
    st = sa.table("service_types", sa.column("id"), sa.column("name"), sa.column("slug"), sa.column("is_active"), sa.column("created_at"))
    sf = sa.table("service_fields", sa.column("service_type_id"), sa.column("label"), sa.column("field_key"), sa.column("field_type"), sa.column("is_required"), sa.column("sort_order"))

    from datetime import datetime
    now = datetime.utcnow()

    op.bulk_insert(st, [{"name": name, "slug": slug, "is_active": True, "created_at": now} for name, slug in SEED_TYPES])

    # Get IDs of seeded types (they'll be 1..4 in a fresh DB)
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id FROM service_types ORDER BY id")).fetchall()
    for (type_id,) in rows:
        op.bulk_insert(sf, [
            {**f, "service_type_id": type_id, "is_required": True}
            for f in SEED_FIELDS
        ])

    # Change cases.service_type from enum to varchar (preserve existing data)
    op.alter_column("cases", "service_type", type_=sa.String(100), existing_nullable=False,
                    postgresql_using="service_type::text")
    op.execute("DROP TYPE IF EXISTS servicetype")


def downgrade():
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE servicetype AS ENUM ('RENOVACION_PLACA','TRASPASO','REVISADO','DUPLICADO');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)
    op.alter_column("cases", "service_type", type_=sa.Enum("RENOVACION_PLACA", "TRASPASO", "REVISADO", "DUPLICADO", name="servicetype"),
                    existing_nullable=False, postgresql_using="service_type::servicetype")
    op.drop_table("service_fields")
    op.drop_table("service_types")
