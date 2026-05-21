"""Library API routes — unified learning items storage."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.library import LibraryItemCreate, LibraryItemUpdate, LibraryItemResponse
from app.services.library_service import library_service

router = APIRouter(prefix="/library", tags=["Library"])


@router.get("", response_model=list[LibraryItemResponse])
async def list_library_items(
    type_filter: str | None = Query(None, alias="type", pattern="^(pdf|note|quiz|roadmap)$"),
    subject: str | None = Query(None),
    tags: list[str] | None = Query(None),
    sort_by: str | None = Query(None, pattern="^(created_at|title)$"),
    order: str | None = Query(None, pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List library items with optional filters."""
    return await library_service.get_all(
        db,
        current_user.id,
        type=type_filter,
        subject=subject,
        tags=tags,
        sort_by=sort_by,
        order=order,
    )


@router.post("", response_model=LibraryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_library_item(
    data: LibraryItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a library item."""
    return await library_service.create(db, data, current_user.id)


@router.get("/{item_id}", response_model=LibraryItemResponse)
async def get_library_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a library item by ID."""
    item = await library_service.get_by_id(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail="Library item not found")
    return item


@router.patch("/{item_id}", response_model=LibraryItemResponse)
async def update_library_item(
    item_id: uuid.UUID,
    data: LibraryItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Partially update a library item."""
    item = await library_service.update(db, item_id, data, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail="Library item not found")
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_library_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a library item."""
    if not await library_service.delete(db, item_id, current_user.id):
        raise HTTPException(status_code=404, detail="Library item not found")
