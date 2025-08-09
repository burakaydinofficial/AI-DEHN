# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for monorepo
COPY package*.json ./
COPY frontend/package.json ./frontend/

# Install all dependencies from root
RUN npm install

# Copy frontend source code
COPY frontend/ ./frontend/

# Build the frontend application
WORKDIR /app/frontend
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration  
COPY --from=builder /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
