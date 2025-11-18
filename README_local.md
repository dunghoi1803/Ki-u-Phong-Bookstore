# Kiều Phong Bookstore – Hướng dẫn chạy dự án

Hướng dẫn ngắn gọn để bất kỳ ai cũng có thể chạy dự án này (backend + frontend) trên máy của mình.

## 1. Cần cài đặt trước

- Python **3.11** (bắt buộc 3.11, không dùng 3.12 cho project này)
- MySQL **8.x**
- Git (tuỳ chọn, nếu lấy code qua git)
- VS Code + extension **Live Server** (khuyến nghị để chạy frontend)

## 2. Chuẩn bị backend (FastAPI)

Từ thư mục gốc dự án `KiềuPhongBookstore`:

```bash
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Tạo file `.env` từ file mẫu và chỉnh thông tin MySQL:

```bash
copy .env.example .env
```

Mở file `.env` và sửa nội dung cho đúng với máy của bạn:

```env
SECRET_KEY=chuoi_bat_ky
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=ten_user_mysql
MYSQL_PASSWORD=mat_khau_mysql
MYSQL_DB=kieuphong_bookstore
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=ChangeMe123!
```

## 3. Tạo database và dữ liệu mẫu

1. Khởi động MySQL.
2. Import cấu trúc bảng và dữ liệu demo (làm một lần).  
   Hai file `.sql` đã nằm sẵn trong thư mục dự án:

```text
C:\Users\dungg\OneDrive\Desktop\KiềuPhongBookstore\book.sql
C:\Users\dungg\OneDrive\Desktop\KiềuPhongBookstore\book_demo_data.sql
```

Trong MySQL Workbench hoặc mysql CLI, lần lượt chạy:

```sql
SOURCE C:/Users/dungg/OneDrive/Desktop/KiềuPhongBookstore/book.sql;
SOURCE C:/Users/dungg/OneDrive/Desktop/KiềuPhongBookstore/book_demo_data.sql;
```

3. (Tuỳ chọn nếu đã import schema) Chạy Alembic để đồng bộ schema:

```bash
cd backend
.\.venv\Scripts\activate
alembic upgrade head
```

## 4. Chạy backend

Từ thư mục `backend`:

```bash
.\.venv\Scripts\activate
uvicorn app.main:app --reload
```

Backend chạy tại:

- API root: `http://127.0.0.1:8000`
- Tài liệu API (Swagger): `http://127.0.0.1:8000/docs`

Giữ cửa sổ này mở khi bạn test frontend.

## 5. Chạy frontend (HTML/JS tĩnh)

Frontend nằm ở thư mục:

```text
Front-end/Front-end Khách hàng
```

Cách dễ nhất (dùng VS Code + Live Server):

1. Mở VS Code, chọn **File → Open Folder...** và mở thư mục `Front-end/Front-end Khách hàng`.
2. Mở file `Index/index.html`.
3. Chuột phải vào file → chọn **Open with Live Server**.
4. Trình duyệt sẽ mở trang, thường là địa chỉ kiểu: `http://127.0.0.1:5500/...`.

Lưu ý: trước khi dùng website, hãy kiểm tra backend đã chạy ở `http://127.0.0.1:8000`.

## 6. Gửi dự án cho người khác

Khi muốn chia sẻ cho người khác:

- Gửi toàn bộ thư mục `KiềuPhongBookstore` (không bỏ bớt backend/frontend).
- Họ chỉ cần làm theo các bước:
  1. Cài Python 3.11 + MySQL 8.x.
  2. Tạo virtualenv trong `backend` và cài `requirements.txt`.
  3. Tạo `.env` từ `.env.example` và chỉnh thông tin MySQL.
  4. Import `book.sql` + `book_demo_data.sql` vào MySQL.
  5. Chạy backend bằng `uvicorn app.main:app --reload`.
  6. Chạy frontend bằng Live Server (hoặc bất kỳ static server nào).
