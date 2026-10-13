from collections.abc import Generator

from fastapi import Depends
from fastapi import HTTPException
from fastapi import status


from jose import JWTError
from jose import jwt

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.database import SessionLocal
from app.models.user import User

from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer

security = HTTPBearer()

def get_db() -> Generator[Session, None, None]:
    """
    Provide a database session for each request.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate JWT token and return the current user.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[
                settings.ALGORITHM
            ],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:

        raise credentials_exception

    user = db.scalar(
        select(User).where(
            User.id == int(user_id)
        )
    )

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    return user


from typing import Callable

from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from app.models.user import User


def require_role(*allowed_roles: str) -> Callable:
    """
    Restrict an endpoint to users with specific roles.
    """

    def role_checker(
        current_user: User = Depends(
            get_current_user
        ),
    ) -> User:

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )

        return current_user

    return role_checker