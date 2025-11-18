"""Order, payment and shipment tables."""
from __future__ import annotations

from datetime import datetime

from typing import List

from sqlalchemy import DECIMAL, JSON, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


don_hang_status_enum = Enum(
    "cho_xac_nhan",
    "da_xac_nhan",
    "dang_chuan_bi",
    "dang_giao",
    "da_giao",
    "da_huy",
    name="don_hang_trang_thai",
)

don_hang_payment_enum = Enum(
    "chua_thanh_toan",
    "da_thanh_toan",
    "hoan_tien",
    "mot_phan",
    name="don_hang_payment_trang_thai",
)

payment_method_enum = Enum("momo", "zalopay", "card", "chuyen_khoan", "cod", name="thanh_toan_phuong_thuc")
payment_status_enum = Enum("initiated", "success", "failed", "refunded", name="thanh_toan_trang_thai")
shipment_status_enum = Enum(
    "ready", "shipping", "delivered", "return_requested", "returned", name="van_chuyen_trang_thai"
)


class DonHang(Base):
    __tablename__ = "don_hang"

    ma_don_hang: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ma_khach_hang: Mapped[int | None] = mapped_column(ForeignKey("nguoi_dung.ma_nguoi_dung"))
    ma_don_hang_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    ten_nguoi_nhan: Mapped[str] = mapped_column(String(120), nullable=False)
    so_dien_thoai: Mapped[str | None] = mapped_column(String(30))
    dia_chi_giao_json: Mapped[dict | None] = mapped_column(JSON)
    tong_tien_hang: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    chiet_khau: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    phi_van_chuyen: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    thue: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    tong_thanh_toan: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    trang_thai_thanh_toan: Mapped[str] = mapped_column(don_hang_payment_enum, default="chua_thanh_toan")
    trang_thai_don_hang: Mapped[str] = mapped_column(don_hang_status_enum, default="cho_xac_nhan")
    ngay_tao: Mapped[datetime] = mapped_column(default=datetime.utcnow, index=True)
    ngay_cap_nhat: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    customer: Mapped["NguoiDung"] = relationship("NguoiDung", back_populates="orders")
    items: Mapped[List["ChiTietDonHang"]] = relationship(
        "ChiTietDonHang", back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )
    status_logs: Mapped[List["LichSuTrangThai"]] = relationship(
        "LichSuTrangThai", back_populates="order", cascade="all, delete-orphan"
    )
    payments: Mapped[List["ThanhToan"]] = relationship(
        "ThanhToan", back_populates="order", cascade="all, delete-orphan"
    )
    shipment: Mapped["VanChuyen"] = relationship(
        "VanChuyen", back_populates="order", uselist=False, cascade="all, delete-orphan"
    )


class ChiTietDonHang(Base):
    __tablename__ = "chi_tiet_don_hang"

    ma_chi_tiet: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ma_don_hang: Mapped[int] = mapped_column(ForeignKey("don_hang.ma_don_hang", ondelete="CASCADE"))
    ma_sach: Mapped[int] = mapped_column(ForeignKey("sach.ma_sach"))
    so_luong: Mapped[int] = mapped_column(Integer, nullable=False)
    don_gia: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped[DonHang] = relationship("DonHang", back_populates="items")
    book: Mapped["Sach"] = relationship("Sach", back_populates="order_items")


class LichSuTrangThai(Base):
    __tablename__ = "lich_su_trang_thai"

    ma_lich_su: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ma_don_hang: Mapped[int] = mapped_column(ForeignKey("don_hang.ma_don_hang", ondelete="CASCADE"))
    trang_thai_cu: Mapped[str | None] = mapped_column(String(32))
    trang_thai_moi: Mapped[str] = mapped_column(String(32), nullable=False)
    nguoi_thay_doi: Mapped[int | None] = mapped_column(ForeignKey("nguoi_dung.ma_nguoi_dung"))
    thoi_gian: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    ghi_chu: Mapped[str | None] = mapped_column(String(500))

    order: Mapped[DonHang] = relationship("DonHang", back_populates="status_logs")


class ThanhToan(Base):
    __tablename__ = "thanh_toan"

    ma_thanh_toan: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ma_don_hang: Mapped[int] = mapped_column(ForeignKey("don_hang.ma_don_hang", ondelete="CASCADE"))
    phuong_thuc: Mapped[str] = mapped_column(payment_method_enum, nullable=False)
    so_tien: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    ma_giao_dich_ncc: Mapped[str | None] = mapped_column(String(128))
    thoi_gian_thanh_toan: Mapped[datetime | None] = mapped_column()
    trang_thai: Mapped[str] = mapped_column(payment_status_enum, default="initiated")
    du_lieu_json: Mapped[dict | None] = mapped_column(JSON)

    order: Mapped[DonHang] = relationship("DonHang", back_populates="payments")


class VanChuyen(Base):
    __tablename__ = "van_chuyen"

    ma_van_don: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ma_don_hang: Mapped[int] = mapped_column(ForeignKey("don_hang.ma_don_hang", ondelete="CASCADE"))
    don_vi_van_chuyen: Mapped[str | None] = mapped_column(String(64))
    ma_theo_doi: Mapped[str | None] = mapped_column(String(64))
    ngay_gui: Mapped[datetime | None] = mapped_column()
    ngay_giao: Mapped[datetime | None] = mapped_column()
    trang_thai: Mapped[str] = mapped_column(shipment_status_enum, default="ready")
    phi_van_chuyen: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    du_lieu_json: Mapped[dict | None] = mapped_column(JSON)

    order: Mapped[DonHang] = relationship("DonHang", back_populates="shipment")
