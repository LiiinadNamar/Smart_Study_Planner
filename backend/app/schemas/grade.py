"""Grade schemas including forecast response."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.grade_method import GradeMethodResponse


class GradeCreate(BaseModel):
    score: float = Field(..., ge=0, le=100)
    method_id: uuid.UUID
    label: str | None = Field(default=None, max_length=255)
    date: date
    subject_id: uuid.UUID


class GradeResponse(BaseModel):
    id: uuid.UUID
    score: float
    weight: float
    method_id: uuid.UUID | None
    method: GradeMethodResponse | None = None
    label: str | None
    date: date
    subject_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GradeForecastResponse(BaseModel):
    """Forecast: how much you need on remaining exams to hit target_grade."""
    subject_id: uuid.UUID
    subject_title: str
    target_grade: float
    current_weighted_average: float
    total_weight_used: float
    remaining_weight: float
    required_score: float | None = Field(
        None,
        description="Score needed on remaining weight to reach target. None if impossible or already achieved.",
    )
    is_achievable: bool
    message: str
