# Portable container image — works on Fly.io, Railway, Google Cloud Run, etc.
# Builds the frontend and runs the single Node service (API + Socket.IO + static).
FROM node:20-slim

# OpenSSL is required by the Prisma query engine on Debian-based images.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better layer caching).
COPY package*.json ./
RUN npm install --include=dev

# Copy the rest of the source and build.
COPY . .
RUN npm run prisma:generate && npx vite build

ENV NODE_ENV=production
# The platform usually injects PORT; default to 3002 if not provided.
ENV PORT=3002
EXPOSE 3002

CMD ["npm", "start"]
