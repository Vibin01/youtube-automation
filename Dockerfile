# Production Multi-Stage Dockerfile for YouTube Automation
FROM node:20-bookworm-slim AS base

# Install system dependencies: Python3, Pip, FFmpeg, and Tamil Unicode fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    fonts-lohit-taml \
    fonts-freefont-ttf \
    fonts-dejavu-core \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Edge-TTS via pip
RUN pip3 install --break-system-packages edge-tts

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy application source
COPY . .

# Generate Prisma Client & Build Next.js Application
RUN npx prisma generate
RUN npm run build

# Expose Next.js Web UI port
EXPOSE 3000

# Create volume mount points for persistent storage
VOLUME ["/app/output", "/app/prisma"]

# Production Entrypoint Script: Runs both Next.js Web App and Daily Autonomous Scheduler
CMD ["sh", "-c", "npx prisma db push && npm run worker:daily & npm run start"]
