"""Quiz schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_index: int


class QuizResponse(BaseModel):
    id: uuid.UUID
    material_id: uuid.UUID
    questions: list[QuizQuestion]
    total_questions: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
