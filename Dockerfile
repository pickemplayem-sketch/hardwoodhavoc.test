# Use a stable Node 18 image
FROM node:18-alpine

WORKDIR /app

# Copy root package files and install root deps (creates /app/node_modules)
COPY package.json package-lock.json* ./
RUN npm install || true

# Install server deps (cached layer)
COPY server/package.json server/package-lock.json* ./server/
RUN npm --prefix server install || true

# Install client deps (cached layer)
COPY client/package.json client/package-lock.json* ./client/
RUN npm --prefix client install || true

# Now copy the **entire** project so index.html and src/ exist for the build
COPY . .

# Build the client after the full copy so Vite sees client/index.html
RUN npm --prefix client run build

# Runtime
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.js"]
