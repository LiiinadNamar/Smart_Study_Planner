"""Task service — CRUD + smart priority calculation."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskStatus
from app.models.subject import Subject
from app.schemas.task import TaskCreate, TaskUpdate


class TaskService:
    """CRUD operations and smart prioritization for tasks."""

    def calculate_priority(self, deadline: datetime | None, credit_hours: int = 3) -> int:
        """Calculate task priority based on deadline proximity and subject importance.

        Priority levels:
            1 = HIGH (due within 2 days, or high credit subject due within 5 days)
            2 = MEDIUM (due within 7 days)
            3 = LOW (due later or no deadline)
        """
        if not deadline:
            return 3  # No deadline = low priority

        now = datetime.now(timezone.utc)
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        days_until = (deadline - now).total_seconds() / 86400

        if days_until <= 0:
            return 1  # Overdue = highest priority
        elif days_until <= 2:
            return 1
        elif days_until <= 5 and credit_hours >= 4:
            return 1  # Important subject, approaching deadline
        elif days_until <= 7:
            return 2
        else:
            return 3

    async def get_all(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        status: str | None = None,
        priority: int | None = None,
        subject_id: uuid.UUID | None = None,
    ) -> list[Task]:
        """Get all tasks for a user with optional filters."""
        stmt = select(Task).where(Task.user_id == user_id)

        if status:
            stmt = stmt.where(Task.status == TaskStatus(status))
        if priority:
            stmt = stmt.where(Task.priority == priority)
        if subject_id:
            stmt = stmt.where(Task.subject_id == subject_id)

        stmt = stmt.order_by(Task.priority.asc(), Task.deadline.asc().nullslast())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID) -> Task | None:
        """Get a single task by ID."""
        stmt = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, data: TaskCreate, user_id: uuid.UUID) -> Task:
        """Create a task with auto-calculated priority."""
        # Look up credit_hours if subject is provided
        credit_hours = 3
        if data.subject_id:
            stmt = select(Subject).where(Subject.id == data.subject_id)
            result = await db.execute(stmt)
            subject = result.scalar_one_or_none()
            if subject:
                credit_hours = subject.credit_hours

        priority = data.priority
        if data.deadline and data.priority == 2:  # Only auto-calc if not explicitly set
            priority = self.calculate_priority(data.deadline, credit_hours)

        task = Task(
            id=uuid.uuid4(),
            title=data.title,
            description=data.description,
            deadline=data.deadline,
            status=TaskStatus(data.status),
            priority=priority,
            subject_id=data.subject_id,
            user_id=user_id,
        )
        db.add(task)
        await db.flush()
        await db.refresh(task)
        return task

    async def update(
        self, db: AsyncSession, task_id: uuid.UUID, data: TaskUpdate, user_id: uuid.UUID
    ) -> Task | None:
        """Update a task."""
        task = await self.get_by_id(db, task_id, user_id)
        if not task:
            return None

        update_data = data.model_dump(exclude_unset=True)

        if "status" in update_data:
            update_data["status"] = TaskStatus(update_data["status"])

        for field, value in update_data.items():
            setattr(task, field, value)

        await db.flush()
        await db.refresh(task)
        return task

    async def delete(self, db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a task."""
        task = await self.get_by_id(db, task_id, user_id)
        if not task:
            return False
        await db.delete(task)
        await db.flush()
        return True


task_service = TaskService()
