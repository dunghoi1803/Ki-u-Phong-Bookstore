"""User, role and address tables."""
from __future__ import annotations

from datetime import datetime

from typing import List

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class VaiTro(Base):
    __tablename__ = "vai_tro"

    ma_vai_tro: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ma_vai_tro_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    ten_vai_tro: Mapped[str] = mapped_column(String(128), nullable=False)

    users: Mapped[List["NguoiDung"]] = relationship(
        "NguoiDung",
        secondary="nguoi_dung_vai_tro",
        back_populates="roles",
        lazy="selectin",
    )


class NguoiDung(Base):
    __tablename__ = "nguoi_dung"

    ma_nguoi_dung: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ho_ten: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(191), unique=True, nullable=False, index=True)
    so_dien_thoai: Mapped[str | None] = mapped_column(String(30))
    mat_khau_ma_hoa: Mapped[str] = mapped_column(String(255), nullable=False)
    trang_thai: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ngay_tao: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ngay_cap_nhat: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ngay_xoa: Mapped[datetime | None] = mapped_column(DateTime)

    roles: Mapped[List[VaiTro]] = relationship(
        "VaiTro",
        secondary="nguoi_dung_vai_tro",
        back_populates="users",
        lazy="selectin",
    )
    addresses: Mapped[List["DiaChi"]] = relationship(
        "DiaChi",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    carts: Mapped[List["GioHang"]] = relationship("GioHang", back_populates="owner", lazy="selectin")
    orders: Mapped[List["DonHang"]] = relationship("DonHang", back_populates="customer", lazy="selectin")
    reviews: Mapped[List["DanhGia"]] = relationship("DanhGia", back_populates="author", lazy="selectin")


class NguoiDungVaiTro(Base):
    __tablename__ = "nguoi_dung_vai_tro"
    ma_nguoi_dung: Mapped[int] = mapped_column(
        ForeignKey("nguoi_dung.ma_nguoi_dung", ondelete="CASCADE"), primary_key=True
    )
    ma_vai_tro: Mapped[int] = mapped_column(
        ForeignKey("vai_tro.ma_vai_tro", ondelete="CASCADE"), primary_key=True
    )


class DiaChi(Base):
    __tablename__ = "dia_chi"

    ma_dia_chi: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ma_nguoi_dung: Mapped[int] = mapped_column(ForeignKey("nguoi_dung.ma_nguoi_dung"), nullable=False)
    ten_dia_chi: Mapped[str | None] = mapped_column(String(64))
    nguoi_nhan: Mapped[str | None] = mapped_column(String(120))
    so_dien_thoai: Mapped[str | None] = mapped_column(String(30))
    dia_chi_chi_tiet: Mapped[str | None] = mapped_column(String(255))
    phuong_xa: Mapped[str | None] = mapped_column(String(128))
    quan_huyen: Mapped[str | None] = mapped_column(String(128))
    tinh_thanh: Mapped[str | None] = mapped_column(String(128))
    ma_buu_dien: Mapped[str | None] = mapped_column(String(20))
    mac_dinh: Mapped[bool] = mapped_column(Boolean, default=False)

    owner: Mapped[NguoiDung] = relationship("NguoiDung", back_populates="addresses")
