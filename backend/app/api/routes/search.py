from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.deps import get_current_user

from app.models.user import User

from app.schemas.search import SearchRequest
from app.schemas.search import SearchResponse
from app.schemas.search import SearchResult

from app.services.vector_search_service import (
    search_similar_chunks,
)


router = APIRouter(
    prefix="/search",
    tags=["Search"],
)


@router.post(
    "",
    response_model=SearchResponse,
)
def search_documents(
    request: SearchRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Search document chunks using
    semantic vector similarity.
    """

    results = search_similar_chunks(
        db=db,
        query=request.query,
        top_k=request.top_k,
    )

    formatted_results = []

    for chunk, distance in results:

        formatted_results.append(
            SearchResult(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                distance=float(distance),
            )
        )

    return SearchResponse(
        query=request.query,
        results=formatted_results,
    )