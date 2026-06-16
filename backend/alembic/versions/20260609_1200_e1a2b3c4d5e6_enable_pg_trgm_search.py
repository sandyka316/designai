"""Enable pg_trgm extension and add GIN indexes for search

Revision ID: e1a2b3c4d5e6
Revises: d06d2bc2916b
Create Date: 2026-06-09 12:00:00.000000+00:00
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'e1a2b3c4d5e6'
down_revision: Union[str, None] = 'd06d2bc2916b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Aktifkan pg_trgm extension (butuh superuser atau pg_extension permission)
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

    # Buat GIN index pada kolom prompt untuk trigram search
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gen_prompt_trgm "
        "ON generation_history USING GIN (prompt gin_trgm_ops);"
    )

    # Buat GIN index pada kolom enhanced_prompt untuk trigram search
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gen_enhanced_prompt_trgm "
        "ON generation_history USING GIN (enhanced_prompt gin_trgm_ops);"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_gen_prompt_trgm;")
    op.execute("DROP INDEX IF EXISTS idx_gen_enhanced_prompt_trgm;")
    # Catatan: tidak drop extension pg_trgm karena mungkin dipakai modul lain
