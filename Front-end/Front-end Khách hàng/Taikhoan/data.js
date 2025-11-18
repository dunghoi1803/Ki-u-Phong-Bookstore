// data.js - DỮ LIỆU ĐÃ CẬP NHẬT TRẠNG THÁI MỚI
localStorage.setItem('orders', JSON.stringify([
  // 1. ĐƠN ĐÃ HỦY
  {
    ma_don_hang: "103794273",
    ma_don_hang_code: "103794273",
    ngay_tao: "2025-11-16T06:55:00",
    tong_thanh_toan: 1709000,
    trang_thai_don_hang: "da_huy",
    trang_thai_thanh_toan: "hoan_tien",
    ten_nguoi_nhan: "Nguyễn Văn A",
    so_dien_thoai: "0901234567",
    dia_chi_giao: "123 Đường Láng, Đống Đa, Hà Nội",
    phuong_thuc_thanh_toan: "COD",
    ngay_thanh_toan: "2025-11-16T07:00:00",
    san_pham: [
      {
        ten_san_pham: "Bác Hồ Viết Tuyên Ngôn Độc Lập - Ấn Bản Kỉ Niệm 80 Năm Quốc Khánh",
        so_luong: 6,
        don_gia: 284833.33,
        hinh_anh: "https://salt.tikicdn.com/ts/product/8a/5e/8c/5d7f7d2e5f8b8d8e8f8a8b8c8d8e8f8g.jpg"
      }
    ]
  },

  // 2. ĐƠN ĐANG GIAO
  {
    ma_don_hang: "103794274",
    ma_don_hang_code: "103794274",
    ngay_tao: "2025-11-15T10:30:00",
    tong_thanh_toan: 850000,
    trang_thai_don_hang: "dang_giao",
    trang_thai_thanh_toan: "da_thanh_toan",
    ten_nguoi_nhan: "Trần Thị B",
    so_dien_thoai: "0912345678",
    dia_chi_giao: "456 Lê Lợi, Quận 1, TP.HCM",
    phuong_thuc_thanh_toan: "Thẻ tín dụng",
    ngay_thanh_toan: "2025-11-15T10:35:00",
    ngay_giao_hang: "2025-11-17T14:00:00",
    san_pham: [
      {
        ten_san_pham: "Sách Lịch Sử Việt Nam - Tập 1",
        so_luong: 1,
        don_gia: 850000,
        hinh_anh: "https://salt.tikicdn.com/ts/product/1a/2b/3c/4d5e6f7g8h9i0j1k2l3m4n5o6p.jpg"
      }
    ]
  },

  // 3. ĐƠN ĐÃ GIAO
  {
    ma_don_hang: "103794275",
    ma_don_hang_code: "103794275",
    ngay_tao: "2025-11-14T08:15:00",
    tong_thanh_toan: 1200000,
    trang_thai_don_hang: "da_giao",
    trang_thai_thanh_toan: "da_thanh_toan",
    ten_nguoi_nhan: "Lê Văn C",
    so_dien_thoai: "0987654321",
    dia_chi_giao: "789 Nguyễn Huệ, Đà Nẵng",
    phuong_thuc_thanh_toan: "Chuyển khoản ngân hàng",
    ngay_thanh_toan: "2025-11-14T08:20:00",
    ngay_giao_hang: "2025-11-15T09:00:00",
    san_pham: [
      {
        ten_san_pham: "Bộ Sách Văn Học Kinh Điển (3 cuốn)",
        so_luong: 1,
        don_gia: 1200000,
        hinh_anh: "https://salt.tikicdn.com/ts/product/9f/8e/7d/6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f.jpg"
      }
    ]
  },

  // 4. ĐƠN CHỜ XÁC NHẬN
  {
    ma_don_hang: "103794276",
    ma_don_hang_code: "103794276",
    ngay_tao: "2025-11-16T14:20:00",
    tong_thanh_toan: 599000,
    trang_thai_don_hang: "cho_xac_nhan",
    trang_thai_thanh_toan: "chua_thanh_toan",
    ten_nguoi_nhan: "Phạm Thị D",
    so_dien_thoai: "0923456789",
    dia_chi_giao: "321 Trần Hưng Đạo, Hải Phòng",
    phuong_thuc_thanh_toan: "Chưa chọn",
    san_pham: [
      {
        ten_san_pham: "Sách Kỹ Năng Sống: Đắc Nhân Tâm",
        so_luong: 1,
        don_gia: 599000,
        hinh_anh: "https://salt.tikicdn.com/ts/product/5e/4d/3c/2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7g.jpg"
      }
    ]
  },

  // 5. ĐƠN ĐANG CHUẨN BỊ
  {
    ma_don_hang: "103794277",
    ma_don_hang_code: "103794277",
    ngay_tao: "2025-11-13T19:45:00",
    tong_thanh_toan: 2400000,
    trang_thai_don_hang: "dang_chuan_bi",
    trang_thai_thanh_toan: "mot_phan",
    ten_nguoi_nhan: "Hoàng Văn E",
    so_dien_thoai: "0934567890",
    dia_chi_giao: "654 Võ Văn Tần, Quận 3, TP.HCM",
    phuong_thuc_thanh_toan: "Thanh toán trước 50%",
    ngay_thanh_toan: "2025-11-13T19:50:00",
    san_pham: [
      {
        ten_san_pham: "Combo 5 Cuốn Sách Tâm Lý Học Tội",
        so_luong: 1,
        don_gia: 2400000,
        hinh_anh: "https://salt.tikicdn.com/ts/product/7g/6f/5e/4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a.jpg"
      }
    ]
  },

]));