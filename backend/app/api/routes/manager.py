from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.deps import require_role
from app.models.user import User
from app.schemas.manager import ManagerTeamMemberResponse
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession
from app.schemas.manager import ManagerQueryResponse


router = APIRouter(
    prefix="/manager",
    tags=["Manager"],
)


@router.get(
    "/queries",
    response_model=list[ManagerQueryResponse],
)
def get_recent_queries(
    current_user: User = Depends(
        require_role("manager")
    ),
    db: Session = Depends(get_db),
):
    try:
        queries = db.execute(
            select(
                ChatMessage.id,
                User.username,
                ChatMessage.content,
                ChatMessage.created_at,
            )
            .join(
                ChatSession,
                ChatMessage.session_id == ChatSession.id,
            )
            .join(
                User,
                ChatSession.user_id == User.id,
            )
            .where(
                ChatMessage.role == "user"
            )
            .order_by(
                ChatMessage.created_at.desc()
            )
            .limit(20)
        ).all()

        return [
            ManagerQueryResponse(
                id=query.id,
                username=query.username,
                question=query.content,
                created_at=query.created_at.isoformat(),
            )
            for query in queries
        ]

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve team queries.",
        )