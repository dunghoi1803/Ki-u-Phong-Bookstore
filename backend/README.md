# Kiều Phong Bookstore – Backend

FastAPI + SQLAlchemy backend that reuses the existing MySQL schema from `book.sql` and powers both the admin and customer frontends.

## Requirements

- Python 3.11+
- MySQL 8.x (the schema expects utf8mb4)
- Virtualenv (recommended)

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # update credentials + secrets
alembic upgrade head
uvicorn app.main:app --reload
```

The service exposes OpenAPI documentation at `http://localhost:8000/docs` and the versioned REST endpoints under `/api/v1`.

## Testing

An in-memory SQLite database is used for unit tests, so you don't need MySQL running:

```bash
cd backend
pytest
```

## High-level architecture

- `app/core`: Runtime configuration + security helpers (JWT + bcrypt)
- `app/db`: SQLAlchemy engine/session + declarative `Base`
- `app/models`: ORM classes mapped 1:1 with the tables inside `book.sql`
- `app/schemas`: Pydantic models for request/response payloads
- `app/api`: FastAPI routers split by domains (auth, catalog, cart, orders)
- `app/services`: Rich domain logic (cart normalization, order creation)
- `alembic`: Database migrations (autogenerate from ORM metadata)

## Next steps

1. Import the sample data from `Front-end/Front-end Khách hàng/book.sql`
2. Connect the existing frontends to the new `/api/v1` endpoints
3. Implement extra routers for admin CRUD (books, stock, roles) as needed
