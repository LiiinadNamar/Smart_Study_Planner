"""GradeMethod model — defines an assessment category for a subject.

A GradeMethod represents how grades are obtained (e.g., "Exams", "Quizzes").
It has a total weight in the final grade and a planned number of grade entries
for the semester. Individual Grade entries for a method will consume
weight_percent / planned_count each.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class GradeMethod(Base):
    __tablename__ = "grade_methods"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False, comment="Custom method name, e.g. 'Quizzes'")

    weight_percent: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Total weight of this method in final grade (0-100)"
    )

    planned_count: Mapped[int] = mapped_column(
        Integer, nullable=False, comment="Planned number of grade entries for this method (>= 1)"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    subject = relationship("Subject", back_populates="grade_methods")
    grades = relationship("Grade", back_populates="method")

    def __repr__(self) -> str:
        return f"<GradeMethod {self.name} ({self.weight_percent}% / {self.planned_count})>"
