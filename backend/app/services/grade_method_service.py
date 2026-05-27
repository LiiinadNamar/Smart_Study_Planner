"""Grade method service — CRUD for assessment categories."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.grade_method import GradeMethod
from app.models.subject import Subject
from app.schemas.grade_method import GradeMethodCreate


class GradeMethodService:
    async def list_by_subject(
        self, db: AsyncSession, subject_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[GradeMethod]:
        # Verify subject ownership
        stmt = select(Subject).where(Subject.id == subject_id, Subject.user_id == user_id)
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            return []

        stmt = (
            select(GradeMethod)
            .where(GradeMethod.subject_id == subject_id)
            .order_by(GradeMethod.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, data: GradeMethodCreate, user_id: uuid.UUID) -> GradeMethod:
        # Verify subject ownership
        stmt = select(Subject).where(Subject.id == data.subject_id, Subject.user_id == user_id)
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            raise ValueError("Subject not found or not owned by user")

        # Enforce unique name per subject (case-insensitive)
        stmt = select(GradeMethod).where(
            GradeMethod.subject_id == data.subject_id,
            func.lower(GradeMethod.name) == data.name.strip().lower(),
        )
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise ValueError("A method with this name already exists for this subject")

        # Enforce sum of weights <= 100
        stmt = select(func.coalesce(func.sum(GradeMethod.weight_percent), 0.0)).where(
            GradeMethod.subject_id == data.subject_id
        )
        result = await db.execute(stmt)
        existing_sum = float(result.scalar_one() or 0.0)
        if existing_sum + float(data.weight_percent) > 100.0 + 1e-9:
            raise ValueError("Total methods weight for this subject cannot exceed 100%")

        method = GradeMethod(
            id=uuid.uuid4(),
            subject_id=data.subject_id,
            name=data.name.strip(),
            weight_percent=float(data.weight_percent),
            planned_count=int(data.planned_count),
        )
        db.add(method)
        await db.flush()
        await db.refresh(method)
        return method


grade_method_service = GradeMethodService()
