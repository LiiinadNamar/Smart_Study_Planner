"""API v1 aggregate router."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.subjects import router as subjects_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.grades import router as grades_router
from app.api.v1.grade_methods import router as grade_methods_router
from app.api.v1.ai import router as ai_router
from app.api.v1.library import router as library_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(subjects_router)
api_router.include_router(tasks_router)
api_router.include_router(grades_router)
api_router.include_router(grade_methods_router)
api_router.include_router(ai_router)
api_router.include_router(library_router)
