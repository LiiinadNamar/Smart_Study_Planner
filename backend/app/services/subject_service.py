"""Subject service — CRUD operations."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate


class SubjectService:
    """CRUD operations for study subjects."""

    async def get_all(self, db: AsyncSession, user_id: uuid.UUID) -> list[Subject]:
        """Get all subjects for a user."""
        stmt = select(Subject).where(Subject.user_id == user_id).order_by(Subject.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, db: AsyncSession, subject_id: uuid.UUID, user_id: uuid.UUID) -> Subject | None:
        """Get a single subject by ID (owned by user)."""
        stmt = select(Subject).where(Subject.id == subject_id, Subject.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, data: SubjectCreate, user_id: uuid.UUID) -> Subject:
        """Create a new subject."""
        subject = Subject(
            id=uuid.uuid4(),
            title=data.title,
            target_grade=data.target_grade,
            credit_hours=data.credit_hours,
            user_id=user_id,
        )
        db.add(subject)
        await db.flush()
        await db.refresh(subject)
        return subject

    async def update(
        self, db: AsyncSession, subject_id: uuid.UUID, data: SubjectUpdate, user_id: uuid.UUID
    ) -> Subject | None:
        """Update an existing subject."""
        subject = await self.get_by_id(db, subject_id, user_id)
        if not subject:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(subject, field, value)

        await db.flush()
        await db.refresh(subject)
        return subject

    async def delete(self, db: AsyncSession, subject_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a subject. Returns True if deleted."""
        subject = await self.get_by_id(db, subject_id, user_id)
        if not subject:
            return False
        await db.delete(subject)
        await db.flush()
        return True


subject_service = SubjectService()
