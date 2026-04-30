"""File storage service — local filesystem implementation."""

import os
import uuid
import aiofiles

from app.core.config import settings


class FileService:
    """Handles file uploads and storage on local filesystem."""

    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    async def save_file(self, file_bytes: bytes, original_filename: str) -> str:
        """Save a file to local storage.

        Args:
            file_bytes: Raw file content.
            original_filename: Original name of the uploaded file.

        Returns:
            Relative path to the saved file.
        """
        ext = os.path.splitext(original_filename)[1].lower()
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(self.upload_dir, unique_name)

        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_bytes)

        return f"/uploads/{unique_name}"

    async def delete_file(self, file_url: str) -> bool:
        """Delete a file from local storage.

        Args:
            file_url: The relative URL path (e.g., /uploads/abc123.pdf).

        Returns:
            True if deleted, False if file didn't exist.
        """
        filename = os.path.basename(file_url)
        file_path = os.path.join(self.upload_dir, filename)

        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False

    def get_max_size_bytes(self) -> int:
        """Get max upload size in bytes."""
        return settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


file_service = FileService()
