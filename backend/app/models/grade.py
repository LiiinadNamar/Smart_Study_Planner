"""Grade model — an individual score entry for a subject."""

import uuid
from datetime import date, datetime

from sqlalchemy import Float, String, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Grade(Base):
    __tablename__ = "grades"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    score: Mapped[float] = mapped_column(Float, nullable=False, comment="Score value 0-100")
    weight: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Weight as percentage (e.g. 30 = 30%)"
    )
    label: Mapped[str | None] = mapped_column(
        String(255), nullable=True, comment="E.g. 'Midterm', 'Quiz 1'"
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    subject = relationship("Subject", back_populates="grades")

    def __repr__(self) -> str:
        return f"<Grade {self.label}: {self.score} ({self.weight}%)>"
