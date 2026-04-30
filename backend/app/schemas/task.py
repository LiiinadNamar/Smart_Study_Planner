"""Task CRUD schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    deadline: datetime | None = None
    status: str = Field(default="todo", pattern="^(todo|doing|done)$")
    priority: int = Field(default=2, ge=1, le=3)
    subject_id: uuid.UUID | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = None
    deadline: datetime | None = None
    status: str | None = Field(default=None, pattern="^(todo|doing|done)$")
    priority: int | None = Field(default=None, ge=1, le=3)
    subject_id: uuid.UUID | None = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    deadline: datetime | None
    status: str
    priority: int
    subject_id: uuid.UUID | None
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
