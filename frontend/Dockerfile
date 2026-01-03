# =============================================================================
# MCP-HIVE-IHM Frontend - Development Dockerfile
# Node.js 22 LTS + pnpm 9.x + Vite
# =============================================================================

FROM node:22-alpine AS development

# Metadata
LABEL maintainer="MCP-HIVE Team"
LABEL description="Frontend development environment for MCP-HIVE-SmartHub"
LABEL version="1.0.0"

# Install pnpm globally (version 9.x - latest stable)
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# Install additional tools for development
RUN apk add --no-cache \
    git \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S vite -u 1001 -G nodejs

# Copy package files first (for better layer caching)
COPY --chown=vite:nodejs package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy source code
COPY --chown=vite:nodejs . .

# Fix permissions for node_modules (for Vite cache)
RUN chown -R vite:nodejs /app/node_modules

# Switch to non-root user
USER vite

# Expose Vite dev server port
EXPOSE 5173

# Environment variables
ENV NODE_ENV=development
ENV VITE_API_BASE_URL=http://host.docker.internal:8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5173 || exit 1

# Default command: start Vite dev server with HMR
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# =============================================================================
# Production build stage
# =============================================================================
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# =============================================================================
# Production serve stage (nginx)
# =============================================================================
FROM nginx:alpine AS production

LABEL maintainer="MCP-HIVE Team"
LABEL description="Frontend production build for MCP-HIVE-SmartHub"

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
