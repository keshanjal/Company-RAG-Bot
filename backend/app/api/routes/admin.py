from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.deps import require_role
from app.models.user import User
from app.schemas.admin import AdminUserResponse
from app.schemas.admin import AdminUserRoleUpdate
from app.schemas.admin import AdminUserStatusUpdate
from app.schemas.admin import UserManagerUpdate


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ============================================================
# Get all users
# ============================================================

@router.get(
    "/users",
    response_model=list[AdminUserResponse],
)
def get_all_users(
    current_user: User = Depends(
        require_role("admin")
    ),
    db: Session = Depends(get_db),
):
    try:
        users = db.scalars(
            select(User).order_by(User.id.asc())
        ).all()

        return users

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users.",
        )


# ============================================================
# Update user role
# ============================================================

@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserResponse,
)
def update_user_role(
    user_id: int,
    payload: AdminUserRoleUpdate,
    current_user: User = Depends(
        require_role("admin")
    ),
    db: Session = Depends(get_db),
):
    allowed_roles = {
        "admin",
        "manager",
        "employee",
    }

    # Validate role
    if payload.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid role. Allowed roles are "
                "admin, manager, and employee."
            ),
        )

    # Prevent admin from changing their own role
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role.",
        )

    try:
        user = db.scalar(
            select(User).where(
                User.id == user_id
            )
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        user.role = payload.role

        db.commit()
        db.refresh(user)

        return user

    except HTTPException:
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user role.",
        )


# ============================================================
# Update user status
# ============================================================

@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserResponse,
)
def update_user_status(
    user_id: int,
    payload: AdminUserStatusUpdate,
    current_user: User = Depends(
        require_role("admin")
    ),
    db: Session = Depends(get_db),
):
    # Prevent admin from deactivating their own account
    if (
        user_id == current_user.id
        and payload.is_active is False
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    try:
        user = db.scalar(
            select(User).where(
                User.id == user_id
            )
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        user.is_active = payload.is_active

        db.commit()
        db.refresh(user)

        return user

    except HTTPException:
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user status.",
        )


# ============================================================
# Assign / Remove Manager
# ============================================================

@router.patch(
    "/users/{user_id}/manager",
    response_model=AdminUserResponse,
)
def update_user_manager(
    user_id: int,
    manager_data: UserManagerUpdate,
    current_user: User = Depends(
        require_role("admin")
    ),
    db: Session = Depends(get_db),
):
    try:
        # ----------------------------------------------------
        # Find employee
        # ----------------------------------------------------

        user = db.scalar(
            select(User).where(
                User.id == user_id
            )
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        # ----------------------------------------------------
        # User must be an employee
        # ----------------------------------------------------

        if user.role != "employee":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Only employees can be assigned "
                    "to a manager."
                ),
            )

        # ----------------------------------------------------
        # Remove manager assignment
        # ----------------------------------------------------

        if manager_data.manager_id is None:
            user.manager_id = None

            db.commit()
            db.refresh(user)

            return user

        # ----------------------------------------------------
        # Find selected manager
        # ----------------------------------------------------

        manager = db.scalar(
            select(User).where(
                User.id == manager_data.manager_id
            )
        )

        if manager is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Manager not found.",
            )

        # ----------------------------------------------------
        # Selected user must be a manager
        # ----------------------------------------------------

        if manager.role != "manager":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Selected user is not a manager."
                ),
            )

        # ----------------------------------------------------
        # Manager must be active
        # ----------------------------------------------------

        if not manager.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Cannot assign an employee to "
                    "an inactive manager."
                ),
            )

        # ----------------------------------------------------
        # Prevent self-assignment
        # ----------------------------------------------------

        if user.id == manager.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "A user cannot be assigned "
                    "to themselves."
                ),
            )

        # ----------------------------------------------------
        # Assign manager
        # ----------------------------------------------------

        user.manager_id = manager.id

        db.commit()
        db.refresh(user)

        return user

    except HTTPException:
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update manager assignment.",
        )