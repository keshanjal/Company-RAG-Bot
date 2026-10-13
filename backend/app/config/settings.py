from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    DATABASE_URL: str

    SECRET_KEY: str

    ALGORITHM: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int

    OPENAI_API_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()

# postpass20new@1
# {
#   "email": "anjal@example.com",
#   "password": "MyPassword123"
# }
# {
#   "query": "What is this document about?",
#   "top_k": 5
# }