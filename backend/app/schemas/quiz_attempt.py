"""QuizAttempt schemas — request/response for saving and reading quiz attempts."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuizAttemptCreate(BaseModel):
    quiz_id: uuid.UUID
    score: int = Field(..., ge=0)
    total: int = Field(..., ge=1)
    answers: dict[str, int] = Field(
        default_factory=dict,
        description="Map of question index (str) to selected option index (int)"
    )


class QuizAttemptResponse(BaseModel):
    id: uuid.UUID
    quiz_id: uuid.UUID
    user_id: uuid.UUID
    score: int
    total: int
    answers: dict
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)
