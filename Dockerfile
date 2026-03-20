# ✅ FIX: Sử dụng Node.js 20 LTS để tương thích Next.js ổn định
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies với npm ci để tái lập build
# ✅ FIX: Set DOCKER_BUILD/SKIP_DB_CHECK để bỏ qua kết nối DB khi build image
ENV DOCKER_BUILD=true
ENV SKIP_DB_CHECK=true
RUN npm ci --legacy-peer-deps

# Sao chép mã nguồn
COPY . .

# Build ứng dụng Next.js
RUN npm run build

# Cấp quyền thực thi cho script khởi động
RUN chmod +x scripts/docker-entrypoint.sh

# Mở port 3000
EXPOSE 3000

# ✅ BUG #25 FIX: Docker Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Chạy ứng dụng (đảm bảo migrate trước khi start)
CMD ["./scripts/docker-entrypoint.sh"]