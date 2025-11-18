Kiều Phong Bookstore – Hệ thống bán sách online (FastAPI + HTML/JS)

Dự án gồm:
- Backend: FastAPI + SQLAlchemy + MySQL
- Frontend: HTML/CSS/JS tĩnh (khách hàng + admin)
- DB: MySQL (schema + dữ liệu mẫu trong thư mục `sql/`)

Đã hỗ trợ chạy bằng Docker để mọi người có thể trải nghiệm dễ dàng.

1. Yêu cầu môi trường

Trên máy của bạn cần cài:
- Git
- Docker Desktop (Windows/Mac) hoặc Docker + docker-compose trên Linux

Không cần cài Python, MySQL hay Node.js.

2. Clone dự án

git clone https://github.com/dunghoi1803/Ki-u-Phong-Bookstore.git
cd Ki-u-Phong-Bookstore

3. Chạy bằng Docker

Lần đầu (hoặc khi có thay đổi lớn):

docker compose up --build

- Docker sẽ:
  - Khởi động MySQL (`db`) và tạo database `kieuphong_bookstore`.
  - Chạy các file `.sql` trong thư mục `sql/` để tạo bảng + dữ liệu mẫu.
  - Build container backend (FastAPI).
  - Build container frontend (Nginx phục vụ thư mục `Front-end/`).

Giữ cửa sổ terminal này mở để xem log.

Lần sau chỉ cần:

docker compose up

4. Truy cập hệ thống

Sau khi docker compose up báo backend và frontend đã chạy, mở trình duyệt:

Backend (API)
- Swagger (tài liệu API + test nhanh):
  - http://localhost:8000/docs

Frontend khách hàng
- Trang chủ:
  - http://localhost:8080/Front-end Khách hàng/Index/index.html
- Danh sách sản phẩm:
  - http://localhost:8080/Front-end Khách hàng/TrangSP/product.html
- Đăng nhập / Đăng ký:
  - http://localhost:8080/Front-end Khách hàng/Login/dangnhap.html
- Giỏ hàng:
  - http://localhost:8080/Front-end Khách hàng/QLGioHang/giohang.html
- Tài khoản khách hàng:
  - http://localhost:8080/Front-end Khách hàng/Taikhoan/taikhoan.html

Frontend admin
1. Đăng nhập bằng tài khoản admin ở trang khách:
   - http://localhost:8080/Front-end Khách hàng/Login/dangnhap.html
2. Mở giao diện admin:
   - http://localhost:8080/Front-end Admin/QLy%20S%C3%A1ch.html

Admin có thể:
- Quản lý sách (CRUD + ngôn ngữ, tác giả, NXB, tồn kho).
- Quản lý danh mục.
- Quản lý đơn hàng và trạng thái thanh toán.
- Xem báo cáo thống kê.

5. Tắt / bật lại

- Tắt: trong cửa sổ đang chạy docker compose up → bấm Ctrl + C.
- Bật lại:
  - cd Ki-u-Phong-Bookstore
  - docker compose up

6. Ghi chú

- Mọi thiết lập DB trong Docker:
  - Host: db
  - Database: kieuphong_bookstore
  - User: kp
  - Password: secret
- Nếu muốn reset sạch DB (mất dữ liệu hiện tại, chỉ còn dữ liệu mẫu):
  - docker compose down -v
  - docker compose up --build

