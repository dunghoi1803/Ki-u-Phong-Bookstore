"""Order endpoints."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api import deps
from app.models import ChiTietDonHang, DonHang, LichSuTrangThai, NguoiDung
from app.schemas import OrderCreate, OrderRead
from app.services.cart import get_or_create_active_cart
from app.services.orders import create_order_from_cart

router = APIRouter()


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    *,
    payload: OrderCreate,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> OrderRead:
    cart = get_or_create_active_cart(db, current_user.ma_nguoi_dung)
    order = create_order_from_cart(
        db,
        cart,
        shipping=payload.shipping.dict(),
        customer_id=current_user.ma_nguoi_dung,
    )
    stmt = (
        select(DonHang)
        .options(selectinload(DonHang.items))
        .where(DonHang.ma_don_hang == order.ma_don_hang)
    )
    order = db.execute(stmt).scalar_one()
    return order


@router.get("/", response_model=list[OrderRead])
def list_orders(
    *,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> list[OrderRead]:
    stmt = (
        select(DonHang)
        .options(selectinload(DonHang.items))
        .where(DonHang.ma_khach_hang == current_user.ma_nguoi_dung)
        .order_by(DonHang.ngay_tao.desc())
    )
    return db.execute(stmt).scalars().all()


@router.get("/{order_id}", response_model=OrderRead)
def get_order(
    order_id: int,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> OrderRead:
    stmt = (
        select(DonHang)
        .options(selectinload(DonHang.items))
        .where(DonHang.ma_don_hang == order_id, DonHang.ma_khach_hang == current_user.ma_nguoi_dung)
    )
    order = db.execute(stmt).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/replace-from-cart", response_model=OrderRead)
def replace_order_from_cart(
    order_id: int,
    payload: OrderCreate,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> OrderRead:
    """Replace an existing pending order's items and shipping info using the current active cart.

    Only allowed when the order is still in 'cho_xac_nhan' (pending confirmation) state.
    """
    stmt = (
        select(DonHang)
        .options(selectinload(DonHang.items))
        .where(DonHang.ma_don_hang == order_id, DonHang.ma_khach_hang == current_user.ma_nguoi_dung)
    )
    order = db.execute(stmt).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.trang_thai_don_hang != "cho_xac_nhan":
        raise HTTPException(
            status_code=400,
            detail="Only orders waiting for confirmation can be edited from cart",
        )

    cart = get_or_create_active_cart(db, current_user.ma_nguoi_dung)
    db.refresh(cart)
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Clear existing order items
    for item in list(order.items):
        db.delete(item)

    shipping = payload.shipping.dict()
    subtotal = sum(float(item.don_gia) * item.so_luong for item in cart.items)

    order.ten_nguoi_nhan = shipping["receiver_name"]
    order.so_dien_thoai = shipping.get("phone")
    order.dia_chi_giao_json = shipping
    order.tong_tien_hang = subtotal
    order.chiet_khau = 0
    order.phi_van_chuyen = shipping.get("shipping_fee", 0)
    order.thue = 0
    order.tong_thanh_toan = subtotal + shipping.get("shipping_fee", 0)
    order.ngay_cap_nhat = datetime.utcnow()

    for cart_item in cart.items:
        db.add(
            ChiTietDonHang(
                ma_don_hang=order.ma_don_hang,
                ma_sach=cart_item.ma_sach,
                so_luong=cart_item.so_luong,
                don_gia=cart_item.don_gia,
            )
        )

    cart.trang_thai = "da_chuyen_don"
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/cancel", response_model=OrderRead)
def cancel_order(
    order_id: int,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> OrderRead:
    """Allow customer to cancel their own order in early states."""
    stmt = (
      select(DonHang)
      .where(DonHang.ma_don_hang == order_id, DonHang.ma_khach_hang == current_user.ma_nguoi_dung)
      .options(selectinload(DonHang.items))
    )
    order = db.execute(stmt).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.trang_thai_don_hang not in {"cho_xac_nhan", "da_xac_nhan", "dang_chuan_bi"}:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled in current status")

    old_status = order.trang_thai_don_hang
    order.trang_thai_don_hang = "da_huy"
    if order.trang_thai_thanh_toan == "da_thanh_toan":
        order.trang_thai_thanh_toan = "hoan_tien"

    log = LichSuTrangThai(
        ma_don_hang=order.ma_don_hang,
        trang_thai_cu=old_status,
        trang_thai_moi=order.trang_thai_don_hang,
        nguoi_thay_doi=current_user.ma_nguoi_dung,
        thoi_gian=datetime.utcnow(),
        ghi_chu="Khách hàng hủy đơn hàng từ giao diện tài khoản",
    )
    db.add(log)
    db.commit()
    db.refresh(order)
    return order
