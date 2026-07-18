FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY db ./db
COPY lib ./lib
COPY sync ./sync
COPY notifications ./notifications
COPY server ./server
COPY scripts ./scripts

EXPOSE 4000
CMD ["node", "--import", "tsx", "server/index.ts"]
