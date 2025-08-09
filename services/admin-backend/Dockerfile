# Admin Backend Dockerfile - Simple Development Build
FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Expose port
EXPOSE 3091

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3091/health || exit 1

# Run the application in development mode
CMD ["npm", "run", "dev"]
