"""Auth service — registration and login business logic."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse


class AuthService:
    """Handles user registration and authentication."""

    async def register(self, db: AsyncSession, data: RegisterRequest) -> TokenResponse:
        """Register a new user and return a JWT token."""
        # Check for existing email
        stmt = select(User).where(User.email == data.email)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise ValueError("A user with this email already exists")

        user = User(
            id=uuid.uuid4(),
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
        )
        db.add(user)
        await db.flush()

        token = create_access_token({"sub": str(user.id), "email": user.email})
        return TokenResponse(access_token=token)

    async def login(self, db: AsyncSession, data: LoginRequest) -> TokenResponse:
        """Authenticate a user and return a JWT token."""
        stmt = select(User).where(User.email == data.email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.hashed_password):
            raise ValueError("Invalid email or password")

        token = create_access_token({"sub": str(user.id), "email": user.email})
        return TokenResponse(access_token=token)


auth_service = AuthService()
