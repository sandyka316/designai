"""Add rating columns to generation_history and create genetic_sessions table

Revision ID: 20260612_0001
Revises: e1a2b3c4d5e6
Create Date: 2026-06-12 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "20260612_0001"
down_revision: Union[str, None] = "e1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Tambah kolom rating ke generation_history ────────────────────────────
    op.add_column(
        "generation_history",
        sa.Column("rating", sa.Integer(), nullable=True),
    )
    op.add_column(
        "generation_history",
        sa.Column("rating_reason", sa.Text(), nullable=True),
    )
    op.add_column(
        "generation_history",
        sa.Column("rated_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Check constraint rating 1-5
    op.create_check_constraint(
        "ck_generation_history_rating",
        "generation_history",
        "rating IS NULL OR (rating >= 1 AND rating <= 5)",
    )

    # ── Tabel genetic_sessions ────────────────────────────────────────────────
    op.create_table(
        "genetic_sessions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("original_prompt", sa.Text(), nullable=False),
        sa.Column("generation_number", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("genes_json", postgresql.JSONB(), nullable=False),
        sa.Column("best_fitness", sa.Float(), nullable=True),
        sa.Column("avg_fitness", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_genetic_sessions_user_id", "genetic_sessions", ["user_id"])
    op.create_index("ix_genetic_sessions_session_id", "genetic_sessions", ["session_id"])


def downgrade() -> None:
    op.drop_table("genetic_sessions")
    op.drop_constraint("ck_generation_history_rating", "generation_history")
    op.drop_column("generation_history", "rated_at")
    op.drop_column("generation_history", "rating_reason")
    op.drop_column("generation_history", "rating")
