# Stage 1: Dependencies
FROM node:18-alpine AS deps

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Stage 2: Runner
FROM node:18-alpine AS runner

# Create app directory
WORKDIR /app

# Install tini
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy .env file first to ensure it exists
COPY --chown=expressjs:nodejs .env ./

# Copy application code
COPY --chown=expressjs:nodejs . .

# Set Node to production mode and load env vars
ENV NODE_ENV=production
ENV $(cat .env | xargs)

# Switch to non-root user
USER expressjs

# Expose the port your app runs on
EXPOSE 8000

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start the server
CMD ["node", "app.js"]