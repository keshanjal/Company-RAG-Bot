from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.deps import get_db

from app.models.user import User
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage

from app.schemas.chat_session import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageResponse,
)


router = APIRouter(
    prefix="/chat/sessions",
    tags=["Chat Sessions"],
)


# =========================================================
# Create Chat Session
# =========================================================

@router.post(
    "",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_chat_session(
    request: ChatSessionCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Create a new chat session for the current user.
    """

    try:

        session = ChatSession(
            user_id=current_user.id,
            title=request.title,
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return session

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat session.",
        )


# =========================================================
# Get All Chat Sessions
# =========================================================

@router.get(
    "",
    response_model=list[ChatSessionResponse],
)
def get_chat_sessions(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Get all chat sessions belonging to the current user.
    """

    try:

        sessions = db.scalars(
            select(ChatSession)
            .where(
                ChatSession.user_id
                == current_user.id
            )
            .order_by(
                ChatSession.updated_at.desc()
            )
        ).all()

        return sessions

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat sessions.",
        )


# =========================================================
# Get Single Chat Session
# =========================================================

@router.get(
    "/{session_id}",
    response_model=ChatSessionResponse,
)
def get_chat_session(
    session_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Get a specific chat session belonging to
    the current user.
    """

    session = db.scalar(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id
            == current_user.id,
        )
    )

    if session is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found.",
        )

    return session


# =========================================================
# Get Chat Session Messages
# =========================================================

@router.get(
    "/{session_id}/messages",
    response_model=list[ChatMessageResponse],
)
def get_chat_session_messages(
    session_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Get all messages belonging to a chat session.

    The session must belong to the current user.
    """

    # -----------------------------------
    # 1. Verify session ownership
    # -----------------------------------

    session = db.scalar(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id
            == current_user.id,
        )
    )

    if session is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found.",
        )

    # -----------------------------------
    # 2. Get messages
    # -----------------------------------

    try:

        messages = db.scalars(
            select(ChatMessage)
            .where(
                ChatMessage.session_id
                == session_id
            )
            .order_by(
                ChatMessage.created_at.asc()
            )
        ).all()

        return messages

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat messages.",
        )


# =========================================================
# Delete Chat Session
# =========================================================

@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_chat_session(
    session_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Delete a chat session belonging to
    the current user.

    Associated messages are also deleted because
    ChatMessage uses CASCADE.
    """

    session = db.scalar(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id
            == current_user.id,
        )
    )

    if session is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found.",
        )

    try:

        db.delete(session)
        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete chat session.",
        )

    return None