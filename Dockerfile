# syntax=docker/dockerfile:1

# ============================================================================
# Stage 1: Build Frontend
# ============================================================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Copy frontend source
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

# Accept build metadata
ARG BUILD_METADATA
ARG GIT_COMMIT
ENV BUILD_METADATA=${BUILD_METADATA}
ENV GIT_COMMIT=${GIT_COMMIT}

# Build frontend
RUN npm run build

# ============================================================================
# Stage 2: Final Runtime Image
# ============================================================================
FROM python:3.11-slim AS runner

# Labels
LABEL org.opencontainers.image.title="Simple LLM"
LABEL org.opencontainers.image.description="A simplified LLM log management and chat testing application"
LABEL org.opencontainers.image.source="https://github.com/mchen-lab/simple-llm"
LABEL org.opencontainers.image.authors="Michael Chen (@mchen-lab)"

WORKDIR /app

# Install runtime dependencies (including Node.js for serve)
RUN apt-get update && apt-get install -y \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g serve

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend from builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Setup data and logs directories
RUN mkdir -p /app/data /app/logs

# Environment variables
ENV PORT=31160
ENV BACKEND_PORT=31161
EXPOSE 31160 31161

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${BACKEND_PORT}/api/settings || exit 1

# Start both services
CMD ["./start.sh"]
