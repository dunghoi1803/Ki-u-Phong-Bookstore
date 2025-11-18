"""Admin-facing order management endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api import deps
from app.models import DonHang, KhoSach, LichSuTrangThai, Sach
from app.schemas import OrderRead

router = APIRouter(dependencies=[Depends(deps.require_admin)])


@router.get("/", response_model=List[OrderRead])
def list_all_orders(db: Session = Depends(deps.get_db)) -> List[OrderRead]:
    """Return all orders for admin, newest first."""
    stmt = (
        select(DonHang)
        .options(selectinload(DonHang.items))
        .order_by(DonHang.ngay_tao.desc())
    )
    return list(db.execute(stmt).scalars().all())


@router.post(
    "/{order_id}/status",
    response_model=OrderRead,
    status_code=status.HTTP_200_OK,
)
def admin_update_order_status(
    order_id: int,
    new_status: str,
    db: Session = Depends(deps.get_db),
    current_admin=Depends(deps.require_admin),
) -> OrderRead:
    """Update order status and adjust inventory when appropriate.

    This mirrors the basic FE logic:
    - Confirming an order releases reserved stock.
    - Cancelling returns stock or reserved quantities depending on previous status.
    - Marking as delivered consumes on-hand stock.
    """
    stmt = (
        select(DonHang)
        .options(selectinload(DonHang.items))
        .where(DonHang.ma_don_hang == order_id)
    )
    order = db.execute(stmt).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    old_status = order.trang_thai_don_hang
    if old_status == new_status:
        return order

    # Helper to fetch inventory row
    def get_inventory(book_id: int) -> KhoSach | None:
        return db.get(KhoSach, book_id)

    # Adjust inventory based on transition
    for item in order.items:
        inventory = get_inventory(item.ma_sach)
        if inventory is None:
            continue

        if new_status == "da_xac_nhan" and old_status == "cho_xac_nhan":
            inventory.so_luong_giu_cho = max(0, inventory.so_luong_giu_cho - item.so_luong)
        elif new_status == "da_huy" and old_status != "da_huy":
            if old_status == "cho_xac_nhan":
                inventory.so_luong_giu_cho = max(0, inventory.so_luong_giu_cho - item.so_luong)
            elif old_status not in {"da_giao"}:
                inventory.so_luong_ton += item.so_luong
        elif new_status == "da_giao" and old_status != "da_giao":
            inventory.so_luong_ton = max(0, inventory.so_luong_ton - item.so_luong)

        db.add(inventory)

    order.trang_thai_don_hang = new_status
    order.ngay_cap_nhat = datetime.utcnow()

    log = LichSuTrangThai(
        ma_don_hang=order.ma_don_hang,
        trang_thai_cu=old_status,
        trang_thai_moi=new_status,
        nguoi_thay_doi=current_admin.ma_nguoi_dung,
        thoi_gian=datetime.utcnow(),
        ghi_chu="Admin updated order status from dashboard",
    )
    db.add(log)
    db.commit()
    db.refresh(order)
    return order


@router.post(
    "/{order_id}/payment-status",
    response_model=OrderRead,
    status_code=status.HTTP_200_OK,
)
def admin_update_payment_status(
    order_id: int,
    new_payment_status: str,
    db: Session = Depends(deps.get_db),
    current_admin=Depends(deps.require_admin),
) -> OrderRead:
    """Update payment status for an order."""
    order = db.get(DonHang, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.trang_thai_thanh_toan = new_payment_status
    order.ngay_cap_nhat = datetime.utcnow()

    log = LichSuTrangThai(
        ma_don_hang=order.ma_don_hang,
        trang_thai_cu=order.trang_thai_don_hang,
        trang_thai_moi=order.trang_thai_don_hang,
        nguoi_thay_doi=current_admin.ma_nguoi_dung,
        thoi_gian=datetime.utcnow(),
        ghi_chu=f"Admin updated payment status to {new_payment_status}",
    )
    db.add(log)
    db.commit()
    db.refresh(order)
    return order
