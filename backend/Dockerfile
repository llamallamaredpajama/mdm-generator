# Backend Dockerfile for Cloud Run
# Build context should be project root, e.g.: docker build -f backend/Dockerfile .
FROM node:20-slim

# Enable Corepack to use pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for dependency caching
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy backend source
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Copy docs folder (needed by promptBuilder)
COPY docs /docs

# Build TypeScript
RUN pnpm run build

# Runtime settings
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]

