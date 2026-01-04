# Backend Dockerfile for Cloud Run
FROM node:20-slim

# Enable Corepack to use pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for dependency caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source
COPY . .

# Build TypeScript
RUN pnpm run build

# Runtime settings
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]

