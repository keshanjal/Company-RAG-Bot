from pydantic import BaseModel
from pydantic import EmailStr


class LoginRequest(BaseModel):
    """
    Schema used when a user logs in.
    """

    email: EmailStr

    password: str