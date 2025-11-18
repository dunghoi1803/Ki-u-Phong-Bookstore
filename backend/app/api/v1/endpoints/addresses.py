"""Endpoints for managing the current user's addresses."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.api import deps
from app.models import DiaChi, NguoiDung
from app.schemas import AddressCreate, AddressRead, AddressUpdate

router = APIRouter()


@router.get("/", response_model=List[AddressRead])
def list_my_addresses(
    *,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> List[AddressRead]:
    """Return all addresses of the current user, default ones first."""
    stmt = (
        select(DiaChi)
        .where(DiaChi.ma_nguoi_dung == current_user.ma_nguoi_dung)
        .order_by(DiaChi.mac_dinh.desc(), DiaChi.ma_dia_chi.desc())
    )
    return list(db.execute(stmt).scalars().all())


@router.post("/", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
def create_my_address(
    *,
    payload: AddressCreate,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> AddressRead:
    """Create a new address for the current user."""
    # If an address with the same core fields already exists for this user,
    # update that entry instead of creating a new row.
    dup_stmt = (
        select(DiaChi)
        .where(
            DiaChi.ma_nguoi_dung == current_user.ma_nguoi_dung,
            DiaChi.dia_chi_chi_tiet == payload.dia_chi_chi_tiet,
            DiaChi.phuong_xa == payload.phuong_xa,
            DiaChi.quan_huyen == payload.quan_huyen,
            DiaChi.tinh_thanh == payload.tinh_thanh,
        )
    )
    existing = db.execute(dup_stmt).scalar_one_or_none()
    if existing is not None:
        # Update existing address with new metadata fields
        if payload.mac_dinh:
            db.execute(
                update(DiaChi)
                .where(
                    DiaChi.ma_nguoi_dung == current_user.ma_nguoi_dung,
                    DiaChi.ma_dia_chi != existing.ma_dia_chi,
                    DiaChi.mac_dinh.is_(True),
                )
                .values(mac_dinh=False)
            )

        for field in (
            "ten_dia_chi",
            "nguoi_nhan",
            "so_dien_thoai",
            "ma_buu_dien",
        ):
            value = getattr(payload, field)
            if value is not None:
                setattr(existing, field, value)

        if payload.mac_dinh is not None:
            existing.mac_dinh = payload.mac_dinh

        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    if payload.mac_dinh:
        # Clear other default addresses for this user
        db.execute(
            update(DiaChi)
            .where(DiaChi.ma_nguoi_dung == current_user.ma_nguoi_dung, DiaChi.mac_dinh.is_(True))
            .values(mac_dinh=False)
        )

    address = DiaChi(
        ma_nguoi_dung=current_user.ma_nguoi_dung,
        ten_dia_chi=payload.ten_dia_chi,
        nguoi_nhan=payload.nguoi_nhan,
        so_dien_thoai=payload.so_dien_thoai,
        dia_chi_chi_tiet=payload.dia_chi_chi_tiet,
        phuong_xa=payload.phuong_xa,
        quan_huyen=payload.quan_huyen,
        tinh_thanh=payload.tinh_thanh,
        ma_buu_dien=payload.ma_buu_dien,
        mac_dinh=payload.mac_dinh,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/{address_id}", response_model=AddressRead)
def update_my_address(
    *,
    address_id: int,
    payload: AddressUpdate,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> AddressRead:
    """Update an address owned by the current user."""
    address = db.get(DiaChi, address_id)
    if address is None or address.ma_nguoi_dung != current_user.ma_nguoi_dung:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    if payload.mac_dinh:
        for addr in current_user.addresses:
            if addr.ma_dia_chi != address.ma_dia_chi and addr.mac_dinh:
                addr.mac_dinh = False
                db.add(addr)

    for field in (
        "ten_dia_chi",
        "nguoi_nhan",
        "so_dien_thoai",
        "dia_chi_chi_tiet",
        "phuong_xa",
        "quan_huyen",
        "tinh_thanh",
        "ma_buu_dien",
    ):
        value = getattr(payload, field)
        if value is not None:
            setattr(address, field, value)

    if payload.mac_dinh is not None:
        address.mac_dinh = payload.mac_dinh

    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_address(
    *,
    address_id: int,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> None:
    """Delete an address owned by the current user."""
    address = db.get(DiaChi, address_id)
    if address is None or address.ma_nguoi_dung != current_user.ma_nguoi_dung:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    db.delete(address)
    db.commit()
