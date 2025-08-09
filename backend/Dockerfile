# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for monorepo
COPY package*.json ./
COPY backend/package.json ./backend/

# Install all dependencies from root
RUN npm install

# Copy backend source code
COPY backend/ ./backend/

# Build the backend application
WORKDIR /app/backend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Create storage directories with proper permissions
RUN mkdir -p /app/storage/private /app/storage/public && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/server.js"]
CMD ["node", "dist/server.js"]
