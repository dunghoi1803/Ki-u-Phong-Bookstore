"""Authentication related schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr


class RoleRead(BaseModel):
    ma_vai_tro: int
    ma_vai_tro_code: str
    ten_vai_tro: str

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    ho_ten: str
    email: EmailStr
    so_dien_thoai: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    ho_ten: Optional[str] = None
    email: Optional[EmailStr] = None
    so_dien_thoai: Optional[str] = None


class UserRead(UserBase):
    ma_nguoi_dung: int
    trang_thai: bool
    ngay_tao: datetime
    roles: List[RoleRead] = []

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str
