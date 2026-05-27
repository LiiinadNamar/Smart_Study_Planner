"""Add grade methods and link grades to methods.

Revision ID: 0001_grade_methods
Revises: 
Create Date: 2026-05-26
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "0001_grade_methods"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    # This migration assumes the database is already initialized (tables created via create_all).
    # If the base tables don't exist yet, fail so the app can fall back to create_all.
    if "grades" not in tables:
        raise RuntimeError("Table 'grades' does not exist. Initialize DB first.")

    if "grade_methods" not in tables:
        op.create_table(
            "grade_methods",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column(
                "subject_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("subjects.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("weight_percent", sa.Float(), nullable=False),
            sa.Column("planned_count", sa.Integer(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
        )
        tables.add("grade_methods")

    # Ensure indexes/constraints on grade_methods exist (safe if create_all created the table first)
    if "grade_methods" in tables:
        method_indexes = {idx.get("name") for idx in inspector.get_indexes("grade_methods")}
        if "ix_grade_methods_subject_id" not in method_indexes:
            op.create_index(
                "ix_grade_methods_subject_id", "grade_methods", ["subject_id"]
            )

        # Unique constraint is best-effort (don't break existing data)
        method_uqs = {uq.get("name") for uq in inspector.get_unique_constraints("grade_methods")}
        if "uq_grade_methods_subject_id_name" not in method_uqs:
            dup = bind.execute(
                sa.text(
                    """
                    SELECT 1
                    FROM grade_methods
                    GROUP BY subject_id, name
                    HAVING COUNT(*) > 1
                    LIMIT 1
                    """
                )
            ).fetchone()
            if not dup:
                op.create_unique_constraint(
                    "uq_grade_methods_subject_id_name",
                    "grade_methods",
                    ["subject_id", "name"],
                )

    grade_columns = {col.get("name") for col in inspector.get_columns("grades")}
    if "method_id" not in grade_columns:
        op.add_column(
            "grades",
            sa.Column("method_id", postgresql.UUID(as_uuid=True), nullable=True),
        )

    grade_indexes = {idx.get("name") for idx in inspector.get_indexes("grades")}
    if "ix_grades_method_id" not in grade_indexes:
        op.create_index("ix_grades_method_id", "grades", ["method_id"])

    grade_fks = {fk.get("name") for fk in inspector.get_foreign_keys("grades")}
    if "fk_grades_method_id_grade_methods" not in grade_fks:
        op.create_foreign_key(
            "fk_grades_method_id_grade_methods",
            "grades",
            "grade_methods",
            ["method_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    if "grades" in tables:
        grade_columns = {col.get("name") for col in inspector.get_columns("grades")}
        grade_indexes = {idx.get("name") for idx in inspector.get_indexes("grades")}
        grade_fks = {fk.get("name") for fk in inspector.get_foreign_keys("grades")}

        if "fk_grades_method_id_grade_methods" in grade_fks:
            op.drop_constraint(
                "fk_grades_method_id_grade_methods", "grades", type_="foreignkey"
            )
        if "ix_grades_method_id" in grade_indexes:
            op.drop_index("ix_grades_method_id", table_name="grades")
        if "method_id" in grade_columns:
            op.drop_column("grades", "method_id")

    if "grade_methods" in tables:
        method_indexes = {idx.get("name") for idx in inspector.get_indexes("grade_methods")}
        method_uqs = {uq.get("name") for uq in inspector.get_unique_constraints("grade_methods")}

        if "uq_grade_methods_subject_id_name" in method_uqs:
            op.drop_constraint(
                "uq_grade_methods_subject_id_name", "grade_methods", type_="unique"
            )
        if "ix_grade_methods_subject_id" in method_indexes:
            op.drop_index("ix_grade_methods_subject_id", table_name="grade_methods")
        op.drop_table("grade_methods")
