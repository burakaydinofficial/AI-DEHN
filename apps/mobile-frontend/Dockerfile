# Mobile Frontend Dockerfile  
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/mobile-frontend/package*.json ./apps/mobile-frontend/
COPY packages/api-models/package*.json ./packages/api-models/
COPY packages/ai-agent/package*.json ./packages/ai-agent/

# Install dependencies
RUN npm ci

# Copy shared packages
COPY packages/ ./packages/
RUN npm run build --workspace=packages/api-models --if-present

# Copy frontend source
COPY apps/mobile-frontend/ ./apps/mobile-frontend/

# Build the application
RUN npm run build --workspace=apps/mobile-frontend

# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Copy everything for development
COPY --from=builder /app/ ./

# Expose Vite dev server port
EXPOSE 8090

# Run dev server
CMD ["npm", "run", "dev", "--workspace=apps/mobile-frontend", "--", "--host", "0.0.0.0"]

# Production stage
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/apps/mobile-frontend/dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY apps/mobile-frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
