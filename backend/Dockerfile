# Backend Dockerfile for Cloud Run
FROM node:20-slim

# Enable Corepack to use pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy backend manifest first to leverage Docker layer caching
COPY backend/package.json ./backend/package.json
# Optional: copy lockfile if present at repo root or backend folder
COPY pnpm-lock.yaml ./pnpm-lock.yaml 2>/dev/null || true
COPY backend/pnpm-lock.yaml ./backend/pnpm-lock.yaml 2>/dev/null || true

WORKDIR /app/backend
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source
COPY backend/ /app/backend/

# Build TypeScript
RUN pnpm run build

# Runtime settings
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]

