from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        description="Question to ask about the uploaded documents",
    )

    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Number of relevant chunks to retrieve",
    )

    session_id: int | None = Field(
        default=None,
        description="Existing chat session ID",
    )


class ChatSource(BaseModel):
    document_id: int
    chunk_id: int
    chunk_index: int
    distance: float
    content: str


class ChatResponse(BaseModel):
    session_id: int
    question: str
    answer: str
    sources: list[ChatSource]


class ChatSessionResponse(BaseModel):
    id: int
    title: str | None
    created_at: datetime
    updated_at: datetime


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime


class ChatSessionDetailResponse(BaseModel):
    id: int
    title: str | None
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse]