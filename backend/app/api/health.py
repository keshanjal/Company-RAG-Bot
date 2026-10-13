from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database.dependencies import get_db


router = APIRouter(
    prefix="/health",
    tags=["Health"]
)


@router.get("/database")
def database_health_check(
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("SELECT current_database();")
    )

    database_name = result.scalar()

    return {
        "status": "connected",
        "database": database_name
    }