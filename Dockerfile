# Stage 1: Build (Bun)
ARG BUN_VERSION=1.2.20
FROM oven/bun:${BUN_VERSION}-alpine AS builder

WORKDIR /app

# Copy package files and lockfile
COPY package.json bun.lock ./

# Install all dependencies (including dev)
RUN bun install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Copy environment variables for build-time static replacement
COPY .env* ./

# Sync SvelteKit and build the app
RUN bun x svelte-kit sync
RUN bun run build

# Prune to production-only dependencies
RUN rm -rf node_modules && bun install --frozen-lockfile --production

# Stage 2: Production runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy necessary files from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Expose the default SvelteKit port
EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Healthcheck to verify the app is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "build"]