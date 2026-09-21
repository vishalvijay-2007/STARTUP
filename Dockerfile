FROM node:22-alpine AS client-build

WORKDIR /app

# Install root dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Install client dependencies
COPY client/package.json client/package-lock.json ./client/
RUN npm ci --prefix client

# Copy client source
COPY client ./client

# Frontend API URL
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Build frontend
RUN npm run build --prefix client


# =========================
# Production
# =========================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy backend
COPY server ./server

# Copy frontend build
COPY --from=client-build /app/client/dist ./client/dist

# Render port
EXPOSE 10000

# Upload storage
VOLUME ["/app/server/uploads"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:10000/api/health').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start backend
CMD ["node", "server/index.js"]