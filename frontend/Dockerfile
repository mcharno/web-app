# Multi-stage build for React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Enable Corepack for Yarn 4
RUN corepack enable

# Copy workspace root files
COPY package.json yarn.lock .yarnrc.yml ./

# Copy workspace package files
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Install all dependencies (workspace will handle it)
RUN yarn install --frozen-lockfile

# Copy frontend source
COPY frontend ./frontend

# Build the application with API URL for production
ENV VITE_API_URL=/api
RUN yarn workspace frontend build

# Production stage with nginx
FROM nginx:1.25-alpine

# Copy custom nginx configs
COPY frontend/nginx-main.conf /etc/nginx/nginx.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Create non-root user and adjust permissions
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 && \
    chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    mkdir -p /var/run && \
    chown -R nginx-app:nginx-app /var/run

# Switch to non-root user
USER nginx-app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
