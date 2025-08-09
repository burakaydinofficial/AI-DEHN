# User Backend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files for workspace setup
COPY package*.json ./
COPY packages/api-models/package*.json ./packages/api-models/
COPY packages/ai-agent/package*.json ./packages/ai-agent/
COPY services/user-backend/package*.json ./services/user-backend/

# Install dependencies
RUN npm ci

# Copy shared packages
COPY packages/ ./packages/
RUN npm run build --workspace=packages/api-models --if-present
RUN npm run build --workspace=packages/ai-agent --if-present

# Copy service source code  
COPY services/user-backend/ ./services/user-backend/

# Build the application
RUN npm run build --workspace=services/user-backend

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY packages/api-models/package*.json ./packages/api-models/
COPY packages/ai-agent/package*.json ./packages/ai-agent/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application and packages
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/user-backend/dist/ ./dist/

# Expose port
EXPOSE 3002

# Health check  
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Run the application
CMD ["node", "dist/server.js"]
