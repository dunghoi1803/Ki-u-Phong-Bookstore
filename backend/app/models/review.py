"""Review table."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class DanhGia(Base):
    __tablename__ = "danh_gia"
    __table_args__ = (
        UniqueConstraint("ma_sach", "ma_nguoi_dung", name="uniq_danh_gia"),
        CheckConstraint("diem_danh_gia BETWEEN 1 AND 5", name="chk_diem_danh_gia"),
    )

    ma_danh_gia: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ma_sach: Mapped[int] = mapped_column(ForeignKey("sach.ma_sach", ondelete="CASCADE"))
    ma_nguoi_dung: Mapped[int] = mapped_column(ForeignKey("nguoi_dung.ma_nguoi_dung", ondelete="CASCADE"))
    diem_danh_gia: Mapped[int] = mapped_column(Integer, nullable=False)
    tieu_de: Mapped[str | None] = mapped_column(String(255))
    noi_dung: Mapped[str | None] = mapped_column(Text)
    duyet_hien_thi: Mapped[bool] = mapped_column(default=False, nullable=False)
    ngay_tao: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ngay_cap_nhat: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    book: Mapped["Sach"] = relationship("Sach", back_populates="reviews")
    author: Mapped["NguoiDung"] = relationship("NguoiDung", back_populates="reviews")
