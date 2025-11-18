"""Cart business logic helpers."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import ChiTietGioHang, GioHang, Sach


def get_active_cart_query(user_id: int):
    return select(GioHang).where(GioHang.ma_nguoi_dung == user_id, GioHang.trang_thai == "hoat_dong")


def get_or_create_active_cart(db: Session, user_id: int) -> GioHang:
    cart = db.execute(get_active_cart_query(user_id)).scalar_one_or_none()
    if cart:
        return cart

    cart = GioHang(ma_nguoi_dung=user_id)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


def _validate_stock(book: Sach, quantity: int) -> None:
    inventory = book.inventory
    available = (inventory.so_luong_ton if inventory else 0) - (inventory.so_luong_giu_cho if inventory else 0)
    if quantity <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Quantity must be positive")
    if quantity > available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Requested quantity exceeds available stock",
        )


def upsert_cart_item(db: Session, cart: GioHang, book_id: int, quantity: int) -> ChiTietGioHang:
    book = db.get(Sach, book_id)
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    _validate_stock(book, quantity)

    stmt = select(ChiTietGioHang).where(
        ChiTietGioHang.ma_gio_hang == cart.ma_gio_hang, ChiTietGioHang.ma_sach == book.ma_sach
    )
    item = db.execute(stmt).scalar_one_or_none()
    if item:
        item.so_luong = quantity
        item.don_gia = book.gia_ban
    else:
        item = ChiTietGioHang(
            ma_gio_hang=cart.ma_gio_hang,
            ma_sach=book.ma_sach,
            so_luong=quantity,
            don_gia=book.gia_ban,
        )
        db.add(item)

    db.commit()
    db.refresh(item)
    db.refresh(cart)
    return item


def remove_cart_item(db: Session, cart: GioHang, item_id: int) -> None:
    item = db.get(ChiTietGioHang, item_id)
    if item is None or item.ma_gio_hang != cart.ma_gio_hang:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    db.delete(item)
    db.commit()


def serialize_cart(cart: GioHang) -> dict:
    return {
        "id": cart.ma_gio_hang,
        "status": cart.trang_thai,
        "items": [
            {
                "item_id": item.ma_chi_tiet,
                "book_id": item.ma_sach,
                "title": item.book.ten_sach if item.book else None,
                "image": item.book.anh_bia if item.book else None,
                "price": float(item.don_gia),
                "quantity": item.so_luong,
                "subtotal": float(item.so_luong * item.don_gia),
            }
            for item in cart.items
        ],
        "total_quantity": sum(item.so_luong for item in cart.items),
        "total_amount": float(sum(item.so_luong * item.don_gia for item in cart.items)),
    }
