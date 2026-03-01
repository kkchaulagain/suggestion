# Root Dockerfile for Fly.io (build context = repo root)
# Builds and runs the backend API.
FROM node:lts-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN npm install

COPY backend/ .
EXPOSE 3000

CMD ["sh", "-c", "npm run dev"]
