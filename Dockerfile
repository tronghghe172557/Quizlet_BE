FROM node:20-alpine AS base

WORKDIR /app

# Cài deps chỉ dựa trên package*.json để tối ưu layer cache
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Sao chép mã nguồn
COPY src ./src

# Thiết lập biến runtime (có thể override bằng docker-compose)
ENV PORT=3000
EXPOSE 3000

# Chạy với quyền không phải root
USER node

CMD ["node", "src/server.js"]

