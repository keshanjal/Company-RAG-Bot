from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.manager import router as manager_router
from app.api.routes.admin import router as admin_router

from app.api.routes.documents import router as documents_router
from app.api.routes import search
from app.api.routes import chat



from app.api.routes.chat_sessions import router as chat_sessions_router

app = FastAPI(
    title="Company Knowledge Bot",
    description="Internal company knowledge management and RAG API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth_router
)

app.include_router(
    admin_router
)

app.include_router(
    manager_router
)

app.include_router(
    documents_router
)

app.include_router(
    search.router
)
app.include_router(
    chat.router
 )
app.include_router(
    chat_sessions_router
)

app.include_router(
    health_router
)

@app.get("/")
def root():
    return {
        "message": "Company Knowledge Bot API"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

    # uvicorn app.main:app --reload  (backend run)