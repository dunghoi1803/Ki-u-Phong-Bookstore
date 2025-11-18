"""Schemas for user address management."""
from typing import Optional

from pydantic import BaseModel


class AddressBase(BaseModel):
    ten_dia_chi: Optional[str] = None
    nguoi_nhan: Optional[str] = None
    so_dien_thoai: Optional[str] = None
    dia_chi_chi_tiet: Optional[str] = None
    phuong_xa: Optional[str] = None
    quan_huyen: Optional[str] = None
    tinh_thanh: Optional[str] = None
    ma_buu_dien: Optional[str] = None
    mac_dinh: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(AddressBase):
    pass


class AddressRead(AddressBase):
    ma_dia_chi: int

    class Config:
        orm_mode = True

