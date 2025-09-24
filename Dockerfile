# MS1 - Customer Service Dockerfile
# Multi-stage build for production optimization

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies needed for native modules
RUN apk add --no-cache python3 make g++

# Copy package files first (for Docker layer caching)
COPY package*.json tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript -> JavaScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Stage 2: Production Runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only production dependencies and built application
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --chown=nodejs:nodejs package*.json ./

# Copy .env.example as template (real .env should be provided at runtime)
COPY --chown=nodejs:nodejs .env.example ./.env.example

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { res.statusCode === 200 ? process.exit(0) : process.exit(1) }).on('error', () => process.exit(1))"

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
