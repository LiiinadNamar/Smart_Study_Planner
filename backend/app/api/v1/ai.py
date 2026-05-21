"""AI API routes — summarize, quiz generation, roadmap, quiz attempts."""

import json
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.subject import Subject
from app.models.learning_material import LearningMaterial
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.task import Task, TaskStatus
from app.schemas.ai import (
    SummarizeResponse,
    GenerateQuizRequest,
    GenerateQuizResponse,
    RoadmapRequest,
    RoadmapResponse,
)
from app.schemas.quiz import QuizResponse
from app.schemas.quiz_attempt import QuizAttemptCreate, QuizAttemptResponse
from app.services.ai_service import ai_service
from app.services.file_service import file_service
from app.services.library_service import library_service
from app.utils.text_extraction import extract_text

router = APIRouter(prefix="/ai", tags=["AI"])


# ─────────────────────────────────────────
# GET /ai/materials  — list user's saved materials
# ─────────────────────────────────────────

class MaterialSummaryItem(BaseModel):
    id: uuid.UUID
    subject_id: uuid.UUID
    subject_title: str
    has_quiz: bool
    quiz_id: uuid.UUID | None
    created_at: datetime


@router.get("/materials", response_model=list[MaterialSummaryItem])
async def list_materials(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all learning materials for the current user (across all their subjects)."""
    # Fetch subjects owned by this user
    stmt = select(Subject).where(Subject.user_id == current_user.id)
    result = await db.execute(stmt)
    subjects = result.scalars().all()
    subject_map = {s.id: s.title for s in subjects}

    if not subject_map:
        return []

    # Fetch materials for those subjects
    stmt = (
        select(LearningMaterial)
        .where(LearningMaterial.subject_id.in_(subject_map.keys()))
        .order_by(LearningMaterial.created_at.desc())
    )
    result = await db.execute(stmt)
    materials = result.scalars().all()

    items = []
    for m in materials:
        # Check if a quiz exists for this material
        quiz_stmt = select(Quiz).where(Quiz.material_id == m.id).limit(1)
        quiz_res = await db.execute(quiz_stmt)
        quiz = quiz_res.scalar_one_or_none()

        items.append(MaterialSummaryItem(
            id=m.id,
            subject_id=m.subject_id,
            subject_title=subject_map.get(m.subject_id, "Unknown"),
            has_quiz=quiz is not None,
            quiz_id=quiz.id if quiz else None,
            created_at=m.created_at,
        ))

    return items


# ─────────────────────────────────────────
# POST /ai/summarize
# ─────────────────────────────────────────

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

    # Verify the subject belongs to this user
    stmt = select(Subject).where(Subject.id == sid, Subject.user_id == current_user.id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Subject not found")

    text = content_text or ""
    file_url = None

    if file:
        file_bytes = await file.read()
        if len(file_bytes) > file_service.get_max_size_bytes():
            raise HTTPException(status_code=413, detail="File too large")

        try:
            text = extract_text(file_bytes, file.filename or "unknown.pdf")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

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
        content_text=text[:10000],
        ai_summary=summary,
        subject_id=sid,
    )
    db.add(material)

    # Auto-save into Library only when a file was uploaded (skip text-only summaries).
    if file_url:
        await library_service.save_item(
            db,
            current_user.id,
            type="pdf",
            title=(file.filename if file and file.filename else "upload.pdf"),
            file_path=file_url,
            content=summary,
            source_feature="summarizer",
        )

    await db.commit()
    await db.refresh(material)

    return SummarizeResponse(material_id=material.id, summary=summary)


# ─────────────────────────────────────────
# POST /ai/generate-quiz
# ─────────────────────────────────────────

@router.post("/generate-quiz", response_model=GenerateQuizResponse)
async def generate_quiz(
    data: GenerateQuizRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a quiz from a learning material's AI summary and save it."""
    stmt = select(LearningMaterial).where(LearningMaterial.id == data.material_id)
    result = await db.execute(stmt)
    material = result.scalar_one_or_none()

    if not material:
        raise HTTPException(status_code=404, detail="Learning material not found")

    summary = material.ai_summary or material.content_text
    if not summary:
        raise HTTPException(status_code=400, detail="Material has no content to generate quiz from")

    try:
        questions = await ai_service.generate_quiz(summary, data.num_questions)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    quiz = Quiz(
        id=uuid.uuid4(),
        material_id=material.id,
        questions=questions,
        total_questions=len(questions),
    )
    db.add(quiz)

    # Auto-save into Library.
    await library_service.save_item(
        db,
        current_user.id,
        type="quiz",
        title=f"Quiz: {len(questions)} questions",
        content=json.dumps(questions),
        source_feature="quiz_generator",
    )

    await db.commit()
    await db.refresh(quiz)

    return GenerateQuizResponse(
        quiz_id=quiz.id,
        questions=questions,
        total_questions=len(questions),
    )


# ─────────────────────────────────────────
# GET /ai/quiz/{material_id}  — fetch existing quiz for a material
# ─────────────────────────────────────────

@router.get("/quiz/{material_id}", response_model=QuizResponse | None)
async def get_quiz_for_material(
    material_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch the existing quiz for a given material (returns null if none)."""
    stmt = select(Quiz).where(Quiz.material_id == material_id).limit(1)
    result = await db.execute(stmt)
    quiz = result.scalar_one_or_none()
    return quiz  # None → 200 with null body is handled by response_model=QuizResponse | None


# ─────────────────────────────────────────
# POST /ai/quiz-attempt  — save a quiz score
# ─────────────────────────────────────────

@router.post("/quiz-attempt", response_model=QuizAttemptResponse)
async def save_quiz_attempt(
    data: QuizAttemptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persist a quiz attempt (score + answers) for the current user."""
    # Verify the quiz exists
    stmt = select(Quiz).where(Quiz.id == data.quiz_id)
    result = await db.execute(stmt)
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    attempt = QuizAttempt(
        id=uuid.uuid4(),
        quiz_id=data.quiz_id,
        user_id=current_user.id,
        score=data.score,
        total=data.total,
        answers=data.answers,
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt


# ─────────────────────────────────────────
# GET /ai/quiz-attempts/{quiz_id}  — history for a quiz
# ─────────────────────────────────────────

@router.get("/quiz-attempts/{quiz_id}", response_model=list[QuizAttemptResponse])
async def get_quiz_attempts(
    quiz_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all past attempts by the current user for a specific quiz."""
    stmt = (
        select(QuizAttempt)
        .where(QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# ─────────────────────────────────────────
# POST /ai/roadmap
# ─────────────────────────────────────────

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

    # Auto-save the generated roadmap into Library.
    await library_service.save_item(
        db,
        current_user.id,
        type="roadmap",
        title=f"Roadmap: {data.goal}",
        content=json.dumps(roadmap_steps),
        source_feature="roadmap_generator",
    )

    await db.commit()

    return RoadmapResponse(
        goal=data.goal,
        weeks=data.weeks,
        roadmap=roadmap_steps,
        tasks_created=tasks_created,
    )
