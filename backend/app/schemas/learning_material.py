"""Learning material schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MaterialCreate(BaseModel):
    subject_id: uuid.UUID
    content_text: str | None = None


class MaterialResponse(BaseModel):
    id: uuid.UUID
    file_url: str | None
    content_text: str | None
    ai_summary: str | None
    subject_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
