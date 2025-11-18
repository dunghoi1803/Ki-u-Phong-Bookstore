FROM python:3.11-slim

WORKDIR /app

# Cài các lib hệ thống tối thiểu (nếu cần build một số package)
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Copy file requirements trước để tận dụng cache layer
COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code backend vào container
COPY backend/ .

# Biến môi trường kết nối DB (sẽ override bằng docker-compose)
ENV DATABASE_URL=mysql+pymysql://kp:secret@db:3306/kieuphong

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]