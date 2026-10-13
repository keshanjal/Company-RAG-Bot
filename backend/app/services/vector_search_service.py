from sqlalchemy.orm import Session

from app.models import User
from app.models import Document
from app.models import DocumentChunk

from app.services.embedding_service import generate_embedding




def search_similar_chunks(
    db: Session,
    query: str,
    top_k: int = 5,
    max_distance: float | None = None,
):
    """
    Search for the most similar document chunks.

    Lower cosine distance means greater similarity.
    """

    query_embedding = generate_embedding(query)

    results_query = (
        db.query(
            DocumentChunk,
            DocumentChunk.embedding.cosine_distance(
                query_embedding
            ).label("distance"),
        )
        .filter(
            DocumentChunk.embedding.isnot(None)
        )
        .order_by(
            DocumentChunk.embedding.cosine_distance(
                query_embedding
            )
        )
        .limit(top_k)
    )

    results = results_query.all()

    if max_distance is not None:
        results = [
            (chunk, distance)
            for chunk, distance in results
            if distance <= max_distance
        ]

    return results