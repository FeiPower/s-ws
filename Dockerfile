# Multi-stage build for SpiralNav UI

# Stage 1: Build
FROM node:18-alpine AS builder

# Install git for npm dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies, ignore optional scripts
RUN npm ci --only=production=false --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies (for preview server)
RUN npm ci --only=production

# Expose port
EXPOSE 4321

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=4321

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:4321', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]

