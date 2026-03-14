# Backend Dockerfile for Cloud Run (multi-stage)
# Build context should be project root, e.g.: docker build -f backend/Dockerfile .

# Stage 1: Build — compile TypeScript
FROM node:20-slim AS builder
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate
WORKDIR /app
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY backend/src ./src
COPY backend/tsconfig.json ./
RUN pnpm run build

# Stage 2: Runtime — production dependencies only
FROM node:20-slim
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate
WORKDIR /app
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
COPY backend/prompts ./prompts
ENV NODE_ENV=production PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]
