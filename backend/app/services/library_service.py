"""Library service — CRUD + filtering for LibraryItem."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.library import LibraryItem
from app.schemas.library import LibraryItemCreate, LibraryItemUpdate


class LibraryService:
    """CRUD operations for library items."""

    async def get_all(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        type: str | None = None,
        subject: str | None = None,
        tags: list[str] | None = None,
        sort_by: str | None = None,
        order: str | None = None,
    ) -> list[LibraryItem]:
        """Get all library items for a user with optional filters."""
        stmt = select(LibraryItem).where(LibraryItem.user_id == user_id)

        if type:
            stmt = stmt.where(LibraryItem.type == type)

        if subject:
            stmt = stmt.where(LibraryItem.subject.ilike(f"%{subject}%"))

        if tags:
            stmt = stmt.where(LibraryItem.tags.contains(tags))

        sort_key = (sort_by or "created_at").lower()
        sort_order = (order or "desc").lower()

        if sort_key == "title":
            col = LibraryItem.title
        else:
            col = LibraryItem.created_at

        stmt = stmt.order_by(col.asc() if sort_order == "asc" else col.desc())

        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(
        self, db: AsyncSession, item_id: uuid.UUID, user_id: uuid.UUID
    ) -> LibraryItem | None:
        """Get a single library item by ID (ownership enforced)."""
        stmt = select(LibraryItem).where(LibraryItem.id == item_id, LibraryItem.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, data: LibraryItemCreate, user_id: uuid.UUID) -> LibraryItem:
        """Create a library item."""
        item = LibraryItem(
            id=uuid.uuid4(),
            user_id=user_id,
            type=data.type,
            title=data.title,
            subject=data.subject,
            tags=data.tags,
            content=data.content,
            file_path=data.file_path,
            source_feature=data.source_feature,
        )
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return item

    async def update(
        self, db: AsyncSession, item_id: uuid.UUID, data: LibraryItemUpdate, user_id: uuid.UUID
    ) -> LibraryItem | None:
        """Partially update a library item."""
        item = await self.get_by_id(db, item_id, user_id)
        if not item:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)

        await db.flush()
        await db.refresh(item)
        return item

    async def delete(self, db: AsyncSession, item_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a library item."""
        item = await self.get_by_id(db, item_id, user_id)
        if not item:
            return False
        await db.delete(item)
        await db.flush()
        return True

    async def save_item(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        *,
        type: str,
        title: str,
        subject: str | None = None,
        tags: list[str] | None = None,
        content: str | None = None,
        file_path: str | None = None,
        source_feature: str | None = None,
    ) -> LibraryItem:
        """Convenience method for internal integrations (AI auto-save, etc.)."""
        item = LibraryItem(
            id=uuid.uuid4(),
            user_id=user_id,
            type=type,
            title=title,
            subject=subject,
            tags=tags,
            content=content,
            file_path=file_path,
            source_feature=source_feature,
        )
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return item


library_service = LibraryService()
