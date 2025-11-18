FROM nginx:alpine

# Copy toàn bộ front-end tĩnh vào thư mục web của nginx
COPY Front-end/ /usr/share/nginx/html
