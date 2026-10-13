from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.deps import get_current_user

from app.models.user import User
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage

from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatSource,
    ChatSessionResponse,
    ChatSessionDetailResponse,
)

from app.services.rag_service import (
    retrieve_context,
    generate_answer,
    get_chat_history,
)


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


@router.post(
    "/ask",
    response_model=ChatResponse,
)
def ask_question(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ask a question about the uploaded company documents.

    Creates a new session when session_id is not provided.
    Uses previous conversation history when session_id is provided.
    """

    try:

        # -----------------------------------
        # 1. Get or create chat session
        # -----------------------------------

        if request.session_id is not None:

            session = db.scalar(
                select(ChatSession).where(
                    ChatSession.id == request.session_id,
                    ChatSession.user_id == current_user.id,
                )
            )

            if session is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat session not found.",
                )

        else:

            session = ChatSession(
                user_id=current_user.id,
                title=request.question[:255],
            )

            db.add(session)
            db.flush()

        # -----------------------------------
        # 2. Get previous chat history
        # -----------------------------------

        chat_history = get_chat_history(
            db=db,
            session_id=session.id,
            limit=10,
        )

        # -----------------------------------
        # 3. Save user message
        # -----------------------------------

        user_message = ChatMessage(
            session_id=session.id,
            role="user",
            content=request.question,
        )

        db.add(user_message)
        db.flush()

        # -----------------------------------
        # 4. Retrieve relevant documents
        # -----------------------------------

        context_chunks = retrieve_context(
            db=db,
            question=request.question,
            top_k=request.top_k,
        )

        # -----------------------------------
        # 5. Generate answer
        # -----------------------------------

        answer = generate_answer(
            question=request.question,
            context_chunks=context_chunks,
            chat_history=chat_history,
        )

        # -----------------------------------
        # 6. Save assistant message
        # -----------------------------------

        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=answer,
        )

        db.add(assistant_message)

        # -----------------------------------
        # 7. Commit conversation
        # -----------------------------------

        db.commit()

        # -----------------------------------
        # 8. Prepare sources
        # -----------------------------------

        sources = []

        for item in context_chunks:

            chunk = item["chunk"]

            sources.append(
                ChatSource(
                    document_id=chunk.document_id,
                    chunk_id=chunk.id,
                    chunk_index=chunk.chunk_index,
                    distance=item["distance"],
                    content=chunk.content,
                )
            )

        # -----------------------------------
        # 9. Return response
        # -----------------------------------

        return ChatResponse(
            session_id=session.id,
            question=request.question,
            answer=answer,
            sources=sources,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request.",
        )