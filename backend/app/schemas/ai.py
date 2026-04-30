"""AI-specific request/response schemas."""

import uuid

from pydantic import BaseModel, Field


class SummarizeRequest(BaseModel):
    subject_id: uuid.UUID
    content_text: str | None = Field(
        default=None, description="Raw text to summarize (alternative to file upload)"
    )


class SummarizeResponse(BaseModel):
    material_id: uuid.UUID
    summary: str


class GenerateQuizRequest(BaseModel):
    material_id: uuid.UUID
    num_questions: int = Field(default=5, ge=1, le=20)


class GenerateQuizResponse(BaseModel):
    quiz_id: uuid.UUID
    questions: list[dict]
    total_questions: int


class RoadmapRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=500, description="Learning goal, e.g. 'Learn React'")
    weeks: int = Field(default=4, ge=1, le=12)
    subject_id: uuid.UUID | None = Field(
        default=None, description="Optional subject to link generated tasks to"
    )


class RoadmapStep(BaseModel):
    week: int
    title: str
    description: str
    tasks: list[str]


class RoadmapResponse(BaseModel):
    goal: str
    weeks: int
    roadmap: list[RoadmapStep]
    tasks_created: int
