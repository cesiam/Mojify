# Unified Mojify: backend + frontend, single URL
# Build from project root: docker build -f Dockerfile .
# Layer order: deps first (cached when only source changes), source last

# Stage 1: Build frontend (VITE_API_URL="" = same-origin, relative URLs)
FROM node:20-alpine AS frontend
WORKDIR /app
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Dependencies first — cached when only frontend source changes
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit
COPY frontend/ .
RUN npm run build

# Stage 2: Backend with frontend baked in
FROM python:3.11-slim

WORKDIR /app

# Dependencies first — cached when only backend source changes
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ .

COPY --from=frontend /app/dist ./frontend_dist

ENV PORT=8080
EXPOSE 8080

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
