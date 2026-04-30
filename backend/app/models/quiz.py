"""Quiz model — AI-generated quiz questions from learning material."""

import uuid
from datetime import datetime

from sqlalchemy import Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("learning_materials.id", ondelete="CASCADE"),
        index=True, nullable=False
    )
    questions: Mapped[dict] = mapped_column(
        JSONB, nullable=False,
        comment='Array of {question, options, correct_index}'
    )
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    material = relationship("LearningMaterial", back_populates="quizzes")

    def __repr__(self) -> str:
        return f"<Quiz {self.id} ({self.total_questions} questions)>"
