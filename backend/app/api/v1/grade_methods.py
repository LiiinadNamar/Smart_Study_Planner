"""Grade methods API routes — list/create assessment categories."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.grade_method import GradeMethodCreate, GradeMethodResponse
from app.services.grade_method_service import grade_method_service

router = APIRouter(prefix="/grade-methods", tags=["Grade Methods"])


@router.get("", response_model=list[GradeMethodResponse])
async def list_grade_methods(
    subject_id: uuid.UUID = Query(..., description="Subject ID to get methods for"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await grade_method_service.list_by_subject(db, subject_id, current_user.id)


@router.post("", response_model=GradeMethodResponse, status_code=status.HTTP_201_CREATED)
async def create_grade_method(
    data: GradeMethodCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await grade_method_service.create(db, data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
