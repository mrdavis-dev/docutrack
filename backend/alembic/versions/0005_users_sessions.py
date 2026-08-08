"""users and sessions (replaces HTTP Basic Auth with server-side sessions)

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-08
"""
import os
import bcrypt
import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

# Seed credentials read directly from the environment (not app.config.Settings — those
# ADMIN_USERNAME/ADMIN_PASSWORD fields were removed once auth moved to the users table).
# This only runs once, at upgrade time, to create the first account; every account after
# that is created via POST /users, stored in the DB like any other user.
SEED_USERNAME = os.environ.get("SEED_ADMIN_USERNAME", "admin")
SEED_PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD", "admin123")


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(200), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
    )

    # First account so upgrading doesn't lock everyone out. Override via
    # SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD env vars before running this migration
    # on a fresh database; change the password immediately after first login otherwise.
    conn = op.get_bind()
    hashed = bcrypt.hashpw(SEED_PASSWORD.encode(), bcrypt.gensalt()).decode()
    conn.execute(
        sa.text("INSERT INTO users (username, password_hash, is_active, created_at) "
                "VALUES (:u, :p, true, now())"),
        {"u": SEED_USERNAME, "p": hashed},
    )


def downgrade():
    op.drop_table("sessions")
    op.drop_table("users")
