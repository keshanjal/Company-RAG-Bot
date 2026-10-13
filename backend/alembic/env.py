from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

from alembic import context

from app.config.settings import settings
from app.database.database import Base

# Import models so Alembic can detect them
from app.models import User

from app.models.document import Document
from app.models.document_chunk import DocumentChunk

from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage


# Alembic Config object
config = context.config


# Configure logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# SQLAlchemy metadata
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in offline mode.
    """

    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in online mode.
    """

    # Create SQLAlchemy engine directly.
    # This avoids Alembic ConfigParser interpolation
    # problems with encoded characters such as %40.
    connectable = create_engine(
        settings.DATABASE_URL,
        poolclass=NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():

    run_migrations_offline()

else:

    run_migrations_online()