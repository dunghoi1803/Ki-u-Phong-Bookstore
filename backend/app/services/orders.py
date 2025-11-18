"""Order helpers that transform carts into orders."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import ChiTietDonHang, DonHang, GioHang


def generate_order_code() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"DH{timestamp}"


def create_order_from_cart(
    db: Session,
    cart: GioHang,
    *,
    shipping: dict[str, Any],
    customer_id: int | None,
) -> DonHang:
    if not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    subtotal = sum(float(item.don_gia) * item.so_luong for item in cart.items)
    order = DonHang(
        ma_khach_hang=customer_id,
        ma_don_hang_code=generate_order_code(),
        ten_nguoi_nhan=shipping["receiver_name"],
        so_dien_thoai=shipping.get("phone"),
        dia_chi_giao_json=shipping,
        tong_tien_hang=subtotal,
        chiet_khau=0,
        phi_van_chuyen=shipping.get("shipping_fee", 0),
        thue=0,
        tong_thanh_toan=subtotal + shipping.get("shipping_fee", 0),
    )
    db.add(order)
    db.flush()

    for item in cart.items:
        db.add(
            ChiTietDonHang(
                ma_don_hang=order.ma_don_hang,
                ma_sach=item.ma_sach,
                so_luong=item.so_luong,
                don_gia=item.don_gia,
            )
        )

    cart.trang_thai = "da_chuyen_don"
    db.commit()
    db.refresh(order)
    return order
