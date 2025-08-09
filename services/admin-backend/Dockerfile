# Admin Backend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy service package files and install dependencies
COPY package*.json ./
RUN npm install --no-package-lock

# Copy service source code
COPY src ./src
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application and dependencies
COPY --from=builder /app/dist ./
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3091

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3091/health || exit 1

# Run the application
CMD ["node", "server.js"]
