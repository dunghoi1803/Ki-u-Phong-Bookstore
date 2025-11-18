"""Cart tables."""
from __future__ import annotations

from datetime import datetime

from typing import List

from sqlalchemy import DECIMAL, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


gio_hang_status_enum = Enum("hoat_dong", "da_chuyen_don", "bo_qua", name="gio_hang_trang_thai")


class GioHang(Base):
    __tablename__ = "gio_hang"

    ma_gio_hang: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ma_nguoi_dung: Mapped[int] = mapped_column(ForeignKey("nguoi_dung.ma_nguoi_dung"), nullable=False, index=True)
    trang_thai: Mapped[str] = mapped_column(gio_hang_status_enum, default="hoat_dong", nullable=False)
    ngay_tao: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    ngay_cap_nhat: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["NguoiDung"] = relationship("NguoiDung", back_populates="carts")
    items: Mapped[List["ChiTietGioHang"]] = relationship(
        "ChiTietGioHang",
        back_populates="cart",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ChiTietGioHang(Base):
    __tablename__ = "chi_tiet_gio_hang"
    __table_args__ = (UniqueConstraint("ma_gio_hang", "ma_sach", name="uniq_gio_sach"),)

    ma_chi_tiet: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ma_gio_hang: Mapped[int] = mapped_column(ForeignKey("gio_hang.ma_gio_hang", ondelete="CASCADE"), nullable=False)
    ma_sach: Mapped[int] = mapped_column(ForeignKey("sach.ma_sach"), nullable=False)
    so_luong: Mapped[int] = mapped_column(Integer, nullable=False)
    don_gia: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    ngay_them: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    cart: Mapped[GioHang] = relationship("GioHang", back_populates="items")
    book: Mapped["Sach"] = relationship("Sach", back_populates="cart_items")
