"""Grade service — CRUD + weighted average calculation + grade forecasting."""

import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.grade import Grade
from app.models.grade_method import GradeMethod
from app.models.subject import Subject
from app.schemas.grade import GradeCreate, GradeForecastResponse


class GradeService:
    """Grade management with weighted average and forecasting."""

    async def get_by_subject(self, db: AsyncSession, subject_id: uuid.UUID, user_id: uuid.UUID) -> list[Grade]:
        """Get all grades for a subject (verify ownership via subject)."""
        # Verify subject ownership
        stmt = select(Subject).where(Subject.id == subject_id, Subject.user_id == user_id)
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            return []

        stmt = (
            select(Grade)
            .options(selectinload(Grade.method))
            .where(Grade.subject_id == subject_id)
            .order_by(Grade.date.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, data: GradeCreate, user_id: uuid.UUID) -> Grade:
        """Add a new grade entry."""
        # Verify subject ownership
        stmt = select(Subject).where(Subject.id == data.subject_id, Subject.user_id == user_id)
        result = await db.execute(stmt)
        subject = result.scalar_one_or_none()
        if not subject:
            raise ValueError("Subject not found or not owned by user")

        # Load method and verify it belongs to the subject
        stmt = select(GradeMethod).where(
            GradeMethod.id == data.method_id,
            GradeMethod.subject_id == data.subject_id,
        )
        result = await db.execute(stmt)
        method = result.scalar_one_or_none()
        if not method:
            raise ValueError("Grade method not found for this subject")

        # Enforce planned_count limit
        stmt = select(func.count(Grade.id)).where(Grade.method_id == method.id)
        result = await db.execute(stmt)
        existing_count = int(result.scalar_one() or 0)
        if existing_count >= method.planned_count:
            raise ValueError("Planned count for this method is already reached")

        weight_per_item = float(method.weight_percent) / float(method.planned_count)

        grade = Grade(
            id=uuid.uuid4(),
            score=data.score,
            weight=weight_per_item,
            label=data.label,
            date=data.date,
            subject_id=data.subject_id,
            method_id=method.id,
        )
        db.add(grade)
        await db.flush()
        await db.refresh(grade, attribute_names=["method"])
        return grade

    async def delete(self, db: AsyncSession, grade_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a grade entry (verify ownership via subject)."""
        stmt = (
            select(Grade)
            .join(Subject, Grade.subject_id == Subject.id)
            .where(Grade.id == grade_id, Subject.user_id == user_id)
        )
        result = await db.execute(stmt)
        grade = result.scalar_one_or_none()
        if not grade:
            return False
        await db.delete(grade)
        await db.flush()
        return True

    def calculate_weighted_average(self, grades: list[Grade]) -> tuple[float, float]:
        """Calculate weighted average: Σ(score_i × weight_i) / Σ(weight_i).

        Returns:
            Tuple of (weighted_average, total_weight_used).
        """
        if not grades:
            return 0.0, 0.0

        total_weighted = sum(g.score * g.weight for g in grades)
        total_weight = sum(g.weight for g in grades)

        if total_weight == 0:
            return 0.0, 0.0

        return total_weighted / total_weight, total_weight

    async def forecast(
        self, db: AsyncSession, subject_id: uuid.UUID, user_id: uuid.UUID
    ) -> GradeForecastResponse:
        """Forecast the required score on remaining exams to reach target_grade.

        Formula: target = (current_sum + required * remaining_weight) / 100
        => required = (target * 100 - current_sum) / remaining_weight
        """
        # Get subject
        stmt = select(Subject).where(Subject.id == subject_id, Subject.user_id == user_id)
        result = await db.execute(stmt)
        subject = result.scalar_one_or_none()
        if not subject:
            raise ValueError("Subject not found")

        # Get all grades
        grades = await self.get_by_subject(db, subject_id, user_id)
        current_avg, total_weight = self.calculate_weighted_average(grades)
        remaining_weight = 100.0 - total_weight

        if remaining_weight <= 0:
            # All weight accounted for
            is_achievable = current_avg >= subject.target_grade
            return GradeForecastResponse(
                subject_id=subject.id,
                subject_title=subject.title,
                target_grade=subject.target_grade,
                current_weighted_average=round(current_avg, 2),
                total_weight_used=round(total_weight, 2),
                remaining_weight=0.0,
                required_score=None,
                is_achievable=is_achievable,
                message="All assessments completed."
                + (" Target reached!" if is_achievable else " Target not reached."),
            )

        # Calculate required score:
        # target = (Σ(score*weight) + required * remaining) / 100
        # required = (target * 100 - Σ(score*weight)) / remaining
        current_sum = sum(g.score * g.weight for g in grades)
        required_score = (subject.target_grade * 100.0 - current_sum) / remaining_weight

        is_achievable = 0 <= required_score <= 100

        required_score_display = round(required_score, 2)

        if required_score < 0:
            message = (
                f"You've already exceeded your target of {subject.target_grade:.2f}! Keep it up!"
            )
            required_score = 0.0
            is_achievable = True
        elif required_score > 100:
            message = (
                f"You need {required_score_display:.2f}% on remaining assessments, "
                f"which exceeds 100%. Target of {subject.target_grade:.2f} may not be reachable."
            )
        else:
            message = (
                f"You need an average of {required_score_display:.2f}% on the remaining "
                f"{remaining_weight:.2f}% of assessments to reach your target of {subject.target_grade:.2f}."
            )

        return GradeForecastResponse(
            subject_id=subject.id,
            subject_title=subject.title,
            target_grade=subject.target_grade,
            current_weighted_average=round(current_avg, 2),
            total_weight_used=round(total_weight, 2),
            remaining_weight=round(remaining_weight, 2),
            required_score=round(required_score, 2),
            is_achievable=is_achievable,
            message=message,
        )


grade_service = GradeService()
