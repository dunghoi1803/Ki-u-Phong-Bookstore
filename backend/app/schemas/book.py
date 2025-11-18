"""Schemas for catalog APIs."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class CategoryRead(BaseModel):
    ma_the_loai: int
    ten_the_loai: str

    class Config:
        orm_mode = True


class CategoryCreate(BaseModel):
    ten_the_loai: str
    ma_the_loai_cha: Optional[int] = None


class CategoryUpdate(BaseModel):
    ten_the_loai: Optional[str] = None
    ma_the_loai_cha: Optional[int] = None


class AuthorRead(BaseModel):
    ma_tac_gia: int
    ten_tac_gia: str

    class Config:
        orm_mode = True


class PublisherRead(BaseModel):
    ma_nxb: int
    ten_nxb: str

    class Config:
        orm_mode = True


class InventoryRead(BaseModel):
    so_luong_ton: int
    so_luong_giu_cho: int
    nguong_thap_toi_thieu: int

    class Config:
        orm_mode = True


class BookBase(BaseModel):
    ma_sach: int
    ma_sku: str
    ten_sach: str
    gia_ban: float
    gia_bia: float
    trang_thai: str
    anh_bia: Optional[str] = None
    ngon_ngu: Optional[str] = None


class BookRead(BookBase):
    duong_dan_slug: str
    mo_ta: Optional[str] = None
    nam_xuat_ban: Optional[int] = None
    so_trang: Optional[int] = None
    ngay_tao: datetime
    ngay_cap_nhat: datetime
    categories: List[CategoryRead] = []
    authors: List[AuthorRead] = []
    publisher: Optional[PublisherRead] = None
    inventory: Optional[InventoryRead] = None

    class Config:
        orm_mode = True


class BookListResponse(BaseModel):
    total: int
    data: List[BookRead]


class BookCreate(BaseModel):
    ma_sku: str
    ten_sach: str
    gia_ban: float
    gia_bia: float
    mo_ta: Optional[str] = None
    so_luong_ton: int = 0
    trang_thai: str = "active"
    anh_bia: Optional[str] = None
    ngon_ngu: Optional[str] = "vi"
    author_name: Optional[str] = None
    category_name: Optional[str] = None
    publisher_name: Optional[str] = None


class BookUpdate(BaseModel):
    ten_sach: Optional[str] = None
    gia_ban: Optional[float] = None
    gia_bia: Optional[float] = None
    mo_ta: Optional[str] = None
    so_luong_ton: Optional[int] = None
    trang_thai: Optional[str] = None
    anh_bia: Optional[str] = None
    ngon_ngu: Optional[str] = None
    author_name: Optional[str] = None
    category_name: Optional[str] = None
    publisher_name: Optional[str] = None
