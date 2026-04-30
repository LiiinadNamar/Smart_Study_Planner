"""Grades API routes — CRUD + forecast endpoint."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.grade import GradeCreate, GradeResponse, GradeForecastResponse
from app.services.grade_service import grade_service

router = APIRouter(prefix="/grades", tags=["Grades"])


@router.get("", response_model=list[GradeResponse])
async def list_grades(
    subject_id: uuid.UUID = Query(..., description="Subject ID to get grades for"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all grades for a subject."""
    return await grade_service.get_by_subject(db, subject_id, current_user.id)


@router.post("", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
async def create_grade(
    data: GradeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new grade entry."""
    try:
        return await grade_service.create(db, data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grade(
    grade_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a grade entry."""
    if not await grade_service.delete(db, grade_id, current_user.id):
        raise HTTPException(status_code=404, detail="Grade not found")


@router.get("/forecast/{subject_id}", response_model=GradeForecastResponse)
async def forecast_grade(
    subject_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Forecast the required score to reach target_grade."""
    try:
        return await grade_service.forecast(db, subject_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
