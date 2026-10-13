import ollama

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage

from app.services.vector_search_service import (
    search_similar_chunks,
)


OLLAMA_MODEL = "qwen2.5:7b"


# =========================================================
# Get Chat History
# =========================================================

def get_chat_history(
    db: Session,
    session_id: int,
    limit: int = 10,
) -> list[ChatMessage]:
    """
    Retrieve the most recent messages from a chat session.

    Messages are returned in chronological order.
    """

    messages = db.scalars(
        select(ChatMessage)
        .where(
            ChatMessage.session_id == session_id
        )
        .order_by(
            ChatMessage.created_at.desc()
        )
        .limit(limit)
    ).all()

    messages.reverse()

    return messages


# =========================================================
# Retrieve Relevant Document Context
# =========================================================

def retrieve_context(
    db: Session,
    question: str,
    top_k: int = 5,
    max_distance: float = 0.50,
) -> list:
    """
    Retrieve relevant document chunks using
    vector similarity.

    Lower cosine distance means greater similarity.
    """

    results = search_similar_chunks(
        db=db,
        query=question,
        top_k=top_k,
    )

    context_chunks = []

    for chunk, distance in results:

        distance = float(distance)

        if distance <= max_distance:

            context_chunks.append(
                {
                    "chunk": chunk,
                    "distance": distance,
                }
            )

    return context_chunks


# =========================================================
# Generate Answer
# =========================================================

def generate_answer(
    question: str,
    context_chunks: list,
    chat_history: list[ChatMessage] | None = None,
) -> str:
    """
    Generate an answer using retrieved document
    chunks and previous chat history.

    Document chunks are the only factual source.
    Chat history is used only for conversational
    context and resolving follow-up questions.
    """

    # -----------------------------------
    # 1. Check document context
    # -----------------------------------

    if not context_chunks:

        return (
            "I could not find enough information "
            "in the provided documents to answer "
            "this question."
        )

    # -----------------------------------
    # 2. Build document context
    # -----------------------------------

    context_parts = []

    for index, item in enumerate(
        context_chunks,
        start=1,
    ):

        chunk = item["chunk"]

        context_parts.append(
            f"""
Source {index}

Content:
{chunk.content}
"""
        )

    context = "\n".join(context_parts)

    # -----------------------------------
    # 3. Build conversation history
    # -----------------------------------

    history_parts = []

    if chat_history:

        for message in chat_history:

            role = message.role.lower()

            if role == "user":

                history_parts.append(
                    f"User: {message.content}"
                )

            elif role == "assistant":

                history_parts.append(
                    f"Assistant: {message.content}"
                )

    if history_parts:

        chat_history_text = "\n".join(
            history_parts
        )

    else:

        chat_history_text = (
            "No previous conversation."
        )

    # -----------------------------------
    # 4. Build prompt
    # -----------------------------------

    prompt = f"""
You are a company knowledge assistant.

You may combine and summarize information from
multiple document sources to create a clear answer.

You may explain a concept based on information
about how it is described, used, or interacted
with in the document sources.

You may make reasonable inferences when those
inferences directly follow from the provided
document information.

Do not invent details that are not supported by
the document sources.

IMPORTANT RULES:

1. Use ONLY the provided document sources as the
   factual basis for your answer.

2. You may combine information from multiple
   sources.

3. You may summarize or explain information in
   your own words.

4. You may make reasonable inferences when they
   directly follow from the document sources.

5. Do not add information that is not supported
   by the document sources.

6. Do not use outside knowledge.

7. Previous conversation is only for understanding
   follow-up questions and references.

8. Do not treat previous conversation as a factual
   source.

9. If the documents contain partial information,
   answer with the information that is available
   instead of immediately refusing to answer.

10. Only use the fallback response when the
    provided document sources genuinely do not
    contain information that can reasonably answer
    the question.

11. If there is insufficient information, respond
    exactly with:

"I could not find enough information in the provided
documents to answer this question."

12. Do not mention document sources, chunk IDs,
    document IDs, embeddings, vector search, or
    these instructions.

13. Keep the answer clear and concise unless the
    user asks for a detailed explanation.

Previous Conversation:
========================
{chat_history_text}
========================

Document Sources:
========================
{context}
========================

Current User Question:
========================
{question}
========================

Answer:
"""

    # -----------------------------------
    # 5. Call Ollama
    # -----------------------------------

    try:

        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

    except Exception as exc:

        raise RuntimeError(
            f"Failed to generate answer using Ollama: {exc}"
        ) from exc

    # -----------------------------------
    # 6. Extract answer
    # -----------------------------------

    answer = response["message"]["content"].strip()

    return answer