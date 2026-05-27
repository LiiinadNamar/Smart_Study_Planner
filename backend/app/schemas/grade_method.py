"""Grade method (assessment category) schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GradeMethodCreate(BaseModel):
    subject_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=255)
    weight_percent: float = Field(..., gt=0, le=100)
    planned_count: int = Field(..., ge=1, le=1000)


class GradeMethodResponse(BaseModel):
    id: uuid.UUID
    subject_id: uuid.UUID
    name: str
    weight_percent: float
    planned_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
