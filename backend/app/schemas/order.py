"""Order request/response schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ShippingInfo(BaseModel):
    receiver_name: str = Field(..., description="Full name of the receiver")
    phone: Optional[str] = None
    address_line: Optional[str] = None
    ward: Optional[str] = None
    district: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    shipping_fee: float = 0


class OrderItemRead(BaseModel):
    ma_sach: int
    so_luong: int
    don_gia: float

    class Config:
        orm_mode = True


class OrderCreate(BaseModel):
    shipping: ShippingInfo


class OrderRead(BaseModel):
    ma_don_hang: int
    ma_don_hang_code: str
    tong_thanh_toan: float
    trang_thai_don_hang: str
    trang_thai_thanh_toan: str
    ngay_tao: datetime
    ten_nguoi_nhan: str
    so_dien_thoai: Optional[str]
    dia_chi_giao_json: dict | None
    items: List[OrderItemRead]

    class Config:
        orm_mode = True
