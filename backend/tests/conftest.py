"""Pytest fixtures for FastAPI backend."""
from __future__ import annotations

import os
from typing import Callable, Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Ensure settings can be instantiated without a real MySQL instance
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("MYSQL_PASSWORD", "dummy-password")

from app.api import deps
from app.db.base import Base
from app.main import app


@pytest.fixture()
def db_session() -> Iterator[Session]:
    """Provide a fresh in-memory database session per test."""
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        future=True,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Iterator[TestClient]:
    """FastAPI TestClient that reuses the injected db_session."""

    def _get_test_db() -> Iterator[Session]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[deps.get_db] = _get_test_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(deps.get_db, None)
