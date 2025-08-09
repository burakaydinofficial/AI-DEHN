# Admin Backend Dockerfile - Development Multi-stage Build
FROM node:18-alpine AS builder

# Install deps for building packages
RUN apk add --no-cache git curl

WORKDIR /workspace

# Copy root package.json and workspace configuration
COPY ../../package.json ./
COPY ../../package-lock.json* ./

# Copy shared packages first
COPY ../../packages/api-models ./packages/api-models
COPY ../../packages/ai-agent ./packages/ai-agent

# Copy this service
COPY ./package.json ./services/admin-backend/package.json
COPY ./src ./services/admin-backend/src
COPY ./tsconfig.json ./services/admin-backend/tsconfig.json

# Install all dependencies (this resolves workspace dependencies)
RUN npm ci --workspace=packages/api-models --workspace=packages/ai-agent --workspace=services/admin-backend

# Build shared packages first
RUN npm run build --workspace=packages/api-models
RUN npm run build --workspace=packages/ai-agent

# Build this service
WORKDIR /workspace/services/admin-backend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application and dependencies
COPY --from=builder /workspace/services/admin-backend/dist ./
COPY --from=builder /workspace/services/admin-backend/node_modules ./node_modules
COPY --from=builder /workspace/services/admin-backend/package.json ./package.json

# Expose port
EXPOSE 3091

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3091/health || exit 1

# Run the application
CMD ["node", "server.js"]
