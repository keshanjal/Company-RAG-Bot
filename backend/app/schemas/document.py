from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict


class DocumentResponse(BaseModel):

    id: int

    filename: str

    file_type: str

    uploaded_by: int

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )