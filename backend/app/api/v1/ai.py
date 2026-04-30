"""AI API routes — summarize, quiz generation, roadmap."""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.learning_material import LearningMaterial
from app.models.quiz import Quiz
from app.models.task import Task, TaskStatus
from app.schemas.ai import (
    SummarizeResponse,
    GenerateQuizRequest,
    GenerateQuizResponse,
    RoadmapRequest,
    RoadmapResponse,
)
from app.services.ai_service import ai_service
from app.services.file_service import file_service
from app.utils.text_extraction import extract_text

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_material(
    subject_id: str = Form(...),
    content_text: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Process a learning material: upload file or provide text, get AI summary.

    Either `file` (PDF/TXT) or `content_text` must be provided.
    """
    try:
        sid = uuid.UUID(subject_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subject_id")

    text = content_text or ""
    file_url = None

    if file:
        # Validate size
        file_bytes = await file.read()
        if len(file_bytes) > file_service.get_max_size_bytes():
            raise HTTPException(status_code=413, detail="File too large")

        # Extract text from file
        try:
            text = extract_text(file_bytes, file.filename or "unknown.pdf")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Save file locally
        file_url = await file_service.save_file(file_bytes, file.filename or "upload.pdf")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text content provided or extracted")

    # Generate AI summary
    try:
        summary = await ai_service.summarize_text(text)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Save material to DB
    material = LearningMaterial(
        id=uuid.uuid4(),
        file_url=file_url,
        content_text=text[:10000],  # Store first 10k chars
        ai_summary=summary,
        subject_id=sid,
    )
    db.add(material)
    await db.flush()

    return SummarizeResponse(material_id=material.id, summary=summary)


@router.post("/generate-quiz", response_model=GenerateQuizResponse)
async def generate_quiz(
    data: GenerateQuizRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a quiz from a learning material's AI summary."""
    from sqlalchemy import select

    # Get material
    stmt = select(LearningMaterial).where(LearningMaterial.id == data.material_id)
    result = await db.execute(stmt)
    material = result.scalar_one_or_none()

    if not material:
        raise HTTPException(status_code=404, detail="Learning material not found")

    summary = material.ai_summary or material.content_text
    if not summary:
        raise HTTPException(status_code=400, detail="Material has no content to generate quiz from")

    # Generate quiz via AI
    try:
        questions = await ai_service.generate_quiz(summary, data.num_questions)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Save quiz to DB
    quiz = Quiz(
        id=uuid.uuid4(),
        material_id=material.id,
        questions=questions,
        total_questions=len(questions),
    )
    db.add(quiz)
    await db.flush()

    return GenerateQuizResponse(
        quiz_id=quiz.id,
        questions=questions,
        total_questions=len(questions),
    )


@router.post("/roadmap", response_model=RoadmapResponse)
async def generate_roadmap(
    data: RoadmapRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a learning roadmap and auto-create tasks."""
    try:
        roadmap_steps = await ai_service.generate_roadmap(data.goal, data.weeks)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Create tasks from roadmap
    tasks_created = 0
    now = datetime.now(timezone.utc)

    for step in roadmap_steps:
        week_num = step.get("week", 1)
        week_start = now + timedelta(weeks=week_num - 1)

        for task_title in step.get("tasks", []):
            task = Task(
                id=uuid.uuid4(),
                title=f"[Week {week_num}] {task_title}",
                description=step.get("description", ""),
                deadline=week_start + timedelta(days=6),
                status=TaskStatus.TODO,
                priority=2,
                subject_id=data.subject_id,
                user_id=current_user.id,
            )
            db.add(task)
            tasks_created += 1

    await db.flush()

    return RoadmapResponse(
        goal=data.goal,
        weeks=data.weeks,
        roadmap=roadmap_steps,
        tasks_created=tasks_created,
    )
