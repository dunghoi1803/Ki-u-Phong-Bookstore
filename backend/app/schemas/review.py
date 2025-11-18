"""Schemas for product reviews."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, conint


class ReviewBase(BaseModel):
    diem_danh_gia: conint(ge=1, le=5) = Field(..., description="Rating score from 1 to 5")
    tieu_de: Optional[str] = None
    noi_dung: Optional[str] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewRead(ReviewBase):
    ma_danh_gia: int
    ma_sach: int
    ngay_tao: datetime
    author_name: str

    class Config:
        orm_mode = True

