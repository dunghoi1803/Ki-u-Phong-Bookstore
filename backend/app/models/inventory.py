"""Inventory tables."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class KhoSach(Base):
    __tablename__ = "kho_sach"

    ma_sach: Mapped[int] = mapped_column(
        ForeignKey("sach.ma_sach", ondelete="CASCADE"), primary_key=True
    )
    so_luong_ton: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    so_luong_giu_cho: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    nguong_thap_toi_thieu: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    ngay_cap_nhat: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    book: Mapped["Sach"] = relationship("Sach", back_populates="inventory")
