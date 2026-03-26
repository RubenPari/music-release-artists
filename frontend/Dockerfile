FROM node:22-alpine AS builder
ARG VITE_API_URL=http://localhost:3333
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
WORKDIR /app
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
