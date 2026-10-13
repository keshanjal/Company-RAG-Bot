from pydantic import BaseModel


class ManagerTeamMemberResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool

    model_config = {
        "from_attributes": True
    }

class ManagerQueryResponse(BaseModel):
    id: int
    username: str
    question: str
    created_at: str