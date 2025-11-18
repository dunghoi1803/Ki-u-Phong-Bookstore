"""Cart endpoints for authenticated customers."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models import ChiTietGioHang, NguoiDung
from app.schemas import CartItemCreate, CartItemUpdate, CartRead
from app.services.cart import get_or_create_active_cart, remove_cart_item, serialize_cart, upsert_cart_item

router = APIRouter()


@router.get("/", response_model=CartRead)
def get_cart(
    *,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> CartRead:
    cart = get_or_create_active_cart(db, current_user.ma_nguoi_dung)
    db.refresh(cart)
    return CartRead(**serialize_cart(cart))


@router.post("/items", response_model=CartRead, status_code=status.HTTP_201_CREATED)
def add_cart_item(
    payload: CartItemCreate,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> CartRead:
    cart = get_or_create_active_cart(db, current_user.ma_nguoi_dung)
    upsert_cart_item(db, cart, payload.book_id, payload.quantity)
    db.refresh(cart)
    return CartRead(**serialize_cart(cart))


@router.patch("/items/{item_id}", response_model=CartRead)
def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> CartRead:
    cart = get_or_create_active_cart(db, current_user.ma_nguoi_dung)
    item = db.get(ChiTietGioHang, item_id)
    if item is None or item.ma_gio_hang != cart.ma_gio_hang:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    upsert_cart_item(db, cart, item.ma_sach, payload.quantity)
    db.refresh(cart)
    return CartRead(**serialize_cart(cart))


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart_item(
    item_id: int,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> None:
    cart = get_or_create_active_cart(db, current_user.ma_nguoi_dung)
    remove_cart_item(db, cart, item_id)
