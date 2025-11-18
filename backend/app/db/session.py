"""SQLAlchemy engine and session management."""
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

db_engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine, future=True)


def get_db() -> Session:
    """Provide a SQLAlchemy session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
