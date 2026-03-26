FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./backend/
WORKDIR /app/backend
RUN node ace build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/backend/build ./build
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3333

CMD ["node", "bin/server.js"]
