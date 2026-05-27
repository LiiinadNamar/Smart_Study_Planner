"""Smart Study Planner — FastAPI application entry point."""

import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.models.base import Base
from app.api.v1.router import api_router

# Import all models so they register with Base.metadata
import app.models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def _run_alembic(args: list[str]) -> tuple[int, str, str]:
    """Run Alembic CLI in a subprocess.

    We use a subprocess because our alembic env.py uses asyncio.run(),
    which cannot be executed inside the running event loop.
    """
    backend_root = Path(__file__).resolve().parents[1]
    proc = await asyncio.create_subprocess_exec(
        sys.executable,
        "-m",
        "alembic",
        *args,
        cwd=str(backend_root),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout_b, stderr_b = await proc.communicate()
    return proc.returncode or 0, stdout_b.decode(), stderr_b.decode()


async def _db_has_any_tables() -> bool:
    async with engine.connect() as conn:
        res = await conn.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                )
                """
            )
        )
        return bool(res.scalar())


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("Starting Smart Study Planner API...")

    # Prefer Alembic migrations.
    # Fallback to create_all for a completely fresh database.
    logger.info("Applying database migrations...")
    code, out, err = await _run_alembic(["upgrade", "head"])
    if code == 0:
        logger.info("Database migrations applied.")
    else:
        logger.warning("Alembic upgrade failed.")
        if out.strip():
            logger.warning("Alembic stdout: %s", out.strip())
        if err.strip():
            logger.warning("Alembic stderr: %s", err.strip())

        # Only do the create_all+stamp fallback for a completely fresh database.
        # If the DB already has tables, stamping head would hide schema drift.
        if await _db_has_any_tables():
            raise RuntimeError(
                "Alembic upgrade failed on a non-empty database; refusing to stamp head. "
                "Fix the migration or manually migrate the DB."
            )

        logger.warning("Empty database detected; falling back to create_all + stamp.")

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Mark current schema as up-to-date for future migrations.
        stamp_code, stamp_out, stamp_err = await _run_alembic(["stamp", "head"])
        if stamp_code != 0:
            logger.warning("Alembic stamp failed.")
            if stamp_out.strip():
                logger.warning("Alembic stdout: %s", stamp_out.strip())
            if stamp_err.strip():
                logger.warning("Alembic stderr: %s", stamp_err.strip())

        logger.info("Database tables ready.")

    yield

    # Shutdown
    await engine.dispose()
    logger.info("Database connections closed.")


app = FastAPI(
    title="Smart Study Planner API",
    description="Personal LMS with AI-powered study tools",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static file serving
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API routes
app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Smart Study Planner API"}
