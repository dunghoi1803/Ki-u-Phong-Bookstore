"""Catalog listing and checkout flow tests."""
from __future__ import annotations

import uuid
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import KhoSach, NhaXuatBan, Sach


def seed_book(db_session: Session) -> Sach:
    publisher = NhaXuatBan(ten_nxb="Test Publisher")
    db_session.add(publisher)
    db_session.flush()

    book = Sach(
        ma_sku=f"SKU-{uuid.uuid4().hex[:6]}",
        ma_isbn=None,
        ten_sach="Sách kiểm thử",
        duong_dan_slug=f"sach-kiem-thu-{uuid.uuid4().hex[:6]}",
        mo_ta="Một cuốn sách dành cho test",
        gia_bia=Decimal("120000.00"),
        gia_ban=Decimal("100000.00"),
        ma_nxb=publisher.ma_nxb,
        nam_xuat_ban=2024,
        trang_thai="active",
    )
    db_session.add(book)
    db_session.flush()

    inventory = KhoSach(
        ma_sach=book.ma_sach,
        so_luong_ton=50,
        so_luong_giu_cho=0,
        nguong_thap_toi_thieu=3,
    )
    db_session.add(inventory)
    db_session.commit()
    db_session.refresh(book)
    return book


def register_and_login(client: TestClient) -> tuple[str, str]:
    email = f"buyer-{uuid.uuid4().hex[:6]}@example.com"
    payload = {
        "ho_ten": "Buyer",
        "email": email,
        "so_dien_thoai": "0911111111",
        "password": "BuyerPass!23",
    }
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": payload["password"]},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    return token, email


def test_book_listing_returns_seeded_book(client: TestClient, db_session: Session) -> None:
    book = seed_book(db_session)
    resp = client.get("/api/v1/books/")
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["total"] == 1
    assert payload["data"][0]["ma_sach"] == book.ma_sach


def test_checkout_flow_from_cart_to_order(client: TestClient, db_session: Session) -> None:
    book = seed_book(db_session)
    token, _ = register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    cart_resp = client.post(
        "/api/v1/cart/items",
        json={"book_id": book.ma_sach, "quantity": 2},
        headers=headers,
    )
    assert cart_resp.status_code == 201
    cart_data = cart_resp.json()
    assert cart_data["total_quantity"] == 2
    assert cart_data["total_amount"] == 200000.0

    order_resp = client.post(
        "/api/v1/orders/",
        json={
            "shipping": {
                "receiver_name": "Buyer",
                "phone": "0911111111",
                "address_line": "123 Đường Test",
                "ward": "Phường 1",
                "district": "Quận 1",
                "province": "TPHCM",
                "postal_code": "70000",
                "shipping_fee": 15000,
            }
        },
        headers=headers,
    )
    assert order_resp.status_code == 201
    order_data = order_resp.json()
    assert order_data["tong_thanh_toan"] == 215000.0
    assert order_data["items"][0]["so_luong"] == 2

    list_resp = client.get("/api/v1/orders/", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
