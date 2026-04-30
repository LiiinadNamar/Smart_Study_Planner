"""Subject CRUD schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SubjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    target_grade: float = Field(default=90.0, ge=0, le=100)
    credit_hours: int = Field(default=3, ge=1, le=10)


class SubjectUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    target_grade: float | None = Field(default=None, ge=0, le=100)
    credit_hours: int | None = Field(default=None, ge=1, le=10)


class SubjectResponse(BaseModel):
    id: uuid.UUID
    title: str
    target_grade: float
    credit_hours: int
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
