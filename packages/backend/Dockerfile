FROM node:20-alpine AS base

# OpenSSL ve gerekli kütüphaneleri yükle (Prisma için)
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Prisma schema ve migration dosyalarını kopyala
COPY prisma ./prisma
RUN npx prisma generate

# Uygulama kodunu kopyala
COPY src ./src

# Sağlık kontrolü
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

EXPOSE 3001

# Migration ve başlatma
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
