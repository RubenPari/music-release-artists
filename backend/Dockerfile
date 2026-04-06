FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app
RUN node ace build --ignore-ts-errors

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3333/health || exit 1

CMD ["node", "bin/server.js"]
