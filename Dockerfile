FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY src ./src

ENV PORT=3000
EXPOSE 3000

USER node

CMD ["node", "src/server.js"]

