"""Import SQLAlchemy models so Alembic can discover metadata."""
from app.db.base_class import Base  # noqa: F401
from app.models import (  # noqa: F401
    ChiTietDonHang,
    ChiTietGioHang,
    DanhGia,
    DiaChi,
    DonHang,
    GioHang,
    KhoSach,
    LichSuTrangThai,
    NguoiDung,
    NguoiDungVaiTro,
    NhaXuatBan,
    Sach,
    SachTacGia,
    SachTheLoai,
    TacGia,
    ThanhToan,
    TheLoai,
    VaiTro,
    VanChuyen,
)
