"""Publishing, category and book tables."""
from __future__ import annotations

from datetime import datetime

from typing import List

from sqlalchemy import DECIMAL, Enum, ForeignKey, Integer, Numeric, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class NhaXuatBan(Base):
    __tablename__ = "nha_xuat_ban"

    ma_nxb: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ten_nxb: Mapped[str] = mapped_column(String(191), unique=True, nullable=False)

    books: Mapped[List["Sach"]] = relationship("Sach", back_populates="publisher", lazy="selectin")


class TacGia(Base):
    __tablename__ = "tac_gia"

    ma_tac_gia: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ten_tac_gia: Mapped[str] = mapped_column(String(191), nullable=False)

    books: Mapped[List["Sach"]] = relationship(
        "Sach",
        secondary="sach_tac_gia",
        back_populates="authors",
        lazy="selectin",
    )


class TheLoai(Base):
    __tablename__ = "the_loai"

    ma_the_loai: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ten_the_loai: Mapped[str] = mapped_column(String(191), nullable=False)
    ma_the_loai_cha: Mapped[int | None] = mapped_column(ForeignKey("the_loai.ma_the_loai"))

    parent: Mapped["TheLoai"] = relationship("TheLoai", remote_side=[ma_the_loai], backref="children")
    books: Mapped[List["Sach"]] = relationship(
        "Sach",
        secondary="sach_the_loai",
        back_populates="categories",
        lazy="selectin",
    )


sach_status_enum = Enum("active", "inactive", name="sach_trang_thai")


class Sach(Base):
    __tablename__ = "sach"

    ma_sach: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ma_sku: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    ma_isbn: Mapped[str | None] = mapped_column(String(32), unique=True)
    ten_sach: Mapped[str] = mapped_column(String(255), nullable=False)
    duong_dan_slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    mo_ta: Mapped[str | None] = mapped_column(Text)
    gia_bia: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    gia_ban: Mapped[float] = mapped_column(Numeric(12, 2), default=0, index=True)
    ma_nxb: Mapped[int | None] = mapped_column(ForeignKey("nha_xuat_ban.ma_nxb"))
    nam_xuat_ban: Mapped[int | None] = mapped_column(SmallInteger)
    so_trang: Mapped[int | None] = mapped_column(Integer)
    ngon_ngu: Mapped[str | None] = mapped_column(String(64))
    khoi_luong: Mapped[int | None] = mapped_column(Integer)
    kich_thuoc_rong: Mapped[int | None] = mapped_column(Integer)
    kich_thuoc_cao: Mapped[int | None] = mapped_column(Integer)
    do_day: Mapped[int | None] = mapped_column(Integer)
    anh_bia: Mapped[str | None] = mapped_column(String(500))
    trang_thai: Mapped[str] = mapped_column(sach_status_enum, default="active", nullable=False)
    ngay_tao: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    ngay_cap_nhat: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    ngay_xoa: Mapped[datetime | None] = mapped_column()

    publisher: Mapped[NhaXuatBan | None] = relationship("NhaXuatBan", back_populates="books")
    authors: Mapped[List[TacGia]] = relationship(
        "TacGia",
        secondary="sach_tac_gia",
        back_populates="books",
        lazy="selectin",
    )
    categories: Mapped[List[TheLoai]] = relationship(
        "TheLoai",
        secondary="sach_the_loai",
        back_populates="books",
        lazy="selectin",
    )
    inventory: Mapped["KhoSach"] = relationship(
        "KhoSach",
        back_populates="book",
        uselist=False,
        lazy="joined",
    )
    cart_items: Mapped[List["ChiTietGioHang"]] = relationship("ChiTietGioHang", back_populates="book")
    order_items: Mapped[List["ChiTietDonHang"]] = relationship("ChiTietDonHang", back_populates="book")
    reviews: Mapped[List["DanhGia"]] = relationship("DanhGia", back_populates="book")


class SachTacGia(Base):
    __tablename__ = "sach_tac_gia"
    ma_sach: Mapped[int] = mapped_column(ForeignKey("sach.ma_sach", ondelete="CASCADE"), primary_key=True)
    ma_tac_gia: Mapped[int] = mapped_column(ForeignKey("tac_gia.ma_tac_gia"), primary_key=True)


class SachTheLoai(Base):
    __tablename__ = "sach_the_loai"
    ma_sach: Mapped[int] = mapped_column(ForeignKey("sach.ma_sach", ondelete="CASCADE"), primary_key=True)
    ma_the_loai: Mapped[int] = mapped_column(ForeignKey("the_loai.ma_the_loai"), primary_key=True)
