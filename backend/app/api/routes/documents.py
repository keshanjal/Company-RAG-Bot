from app.services.embedding_service import generate_embedding
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import HTTPException
from fastapi import UploadFile
from fastapi import status

from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.deps import require_role
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.pdf_service import (
    extract_text_from_pdf,
)
from app.models.document_chunk import DocumentChunk

from app.services.chunking_service import (
    chunk_text,
)


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


UPLOAD_DIR = Path("uploads")

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_role(
            "manager",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF document,
    extract its text,
    split it into chunks,
    and save everything to the database.
    """

    # -----------------------------------
    # 1. Validate file type
    # -----------------------------------

    if file.content_type != "application/pdf":

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed.",
        )

    # -----------------------------------
    # 2. Validate filename
    # -----------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required.",
        )

    # -----------------------------------
    # 3. Generate unique filename
    # -----------------------------------

    file_extension = (
        Path(file.filename)
        .suffix
        .lower()
    )

    unique_filename = (
        f"{uuid4()}{file_extension}"
    )

    file_path = (
        UPLOAD_DIR
        / unique_filename
    )

    # -----------------------------------
    # 4. Save uploaded PDF
    # -----------------------------------

    with file_path.open(
        "wb"
    ) as buffer:

        while chunk := await file.read(
            1024 * 1024
        ):

            buffer.write(chunk)

    # -----------------------------------
    # 5. Extract PDF text
    # -----------------------------------

    extracted_text = (
        extract_text_from_pdf(
            str(file_path)
        )
    )

    # -----------------------------------
    # 6. Check extracted text
    # -----------------------------------

    if not extracted_text:

        file_path.unlink(
            missing_ok=True
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Could not extract text "
                "from the PDF."
            ),
        )

    # -----------------------------------
    # 7. Create text chunks
    # -----------------------------------

    chunks = chunk_text(
        extracted_text,
        chunk_size=1000,
        chunk_overlap=200,
    )

    # -----------------------------------
    # 8. Create Document
    # -----------------------------------

    document = Document(
        filename=file.filename,
        file_path=str(file_path),
        file_type="application/pdf",
        extracted_text=extracted_text,
        uploaded_by=current_user.id,
    )

    # -----------------------------------
    # 9. Add chunks to Document
    # -----------------------------------

    for index, chunk_content in enumerate(chunks):

     embedding = generate_embedding(
        chunk_content
     )

     document.chunks.append(
        DocumentChunk(
            chunk_index=index,
            content=chunk_content,
            embedding=embedding,
        )
    )

    # -----------------------------------
    # 10. Save Document + Chunks
    # -----------------------------------

    db.add(document)

    db.commit()

    db.refresh(document)

    return document