from pydantic import BaseModel


class Token(BaseModel):
    """
    Schema returned after successful login.
    """

    access_token: str

    token_type: str