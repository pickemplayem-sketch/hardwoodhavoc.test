# Use a stable Node 18 image
FROM node:18-alpine

# Create app dir
WORKDIR /app

# Copy root package files and install root deps (creates /app/node_modules)
COPY package.json package-lock.json* ./
RUN npm install || true

# Server deps (kept separate for caching)
COPY server/package.json server/package-lock.json* ./server/
RUN npm --prefix server install || true

# Client deps + build (kept separate for caching)
COPY client/package.json client/package-lock.json* ./client/
RUN npm --prefix client install || true
RUN npm --prefix client run build

# Copy the rest of the project (server code, client/dist, data, etc.)
COPY . .

# Prod env and port
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Start the Node server
CMD ["node", "server/index.js"]
