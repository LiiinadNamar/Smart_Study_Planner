"""Library CRUD schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LibraryItemCreate(BaseModel):
    type: str = Field(..., pattern="^(pdf|note|quiz|roadmap)$")
    title: str = Field(..., min_length=1, max_length=500)
    subject: str | None = Field(default=None, max_length=255)
    tags: list[str] | None = None
    content: str | None = None
    file_path: str | None = Field(default=None, max_length=500)
    source_feature: str | None = Field(default=None, max_length=100)


class LibraryItemUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    subject: str | None = Field(default=None, max_length=255)
    tags: list[str] | None = None


class LibraryItemResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    subject: str | None
    tags: list[str] | None
    content: str | None
    file_path: str | None
    source_feature: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
