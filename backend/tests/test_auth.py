"""Authentication endpoint tests."""
from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def test_register_and_login_flow(client: TestClient) -> None:
    email = f"user-{uuid.uuid4().hex[:6]}@example.com"
    payload = {
        "ho_ten": "Test User",
        "email": email,
        "so_dien_thoai": "0900000000",
        "password": "StrongPass!1",
    }

    register_resp = client.post("/api/v1/auth/register", json=payload)
    assert register_resp.status_code == 201
    data = register_resp.json()
    assert data["email"] == email
    assert data["roles"], "New users should receive the default role"

    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": payload["password"]},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    profile = me_resp.json()
    assert profile["email"] == email
