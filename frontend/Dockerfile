FROM node:22-alpine AS builder
ARG VITE_API_URL=http://127.0.0.1:3333
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
WORKDIR /app
RUN npm run build

FROM nginx:alpine AS runner

ENV NGINX_ENVSUBST_FILTER=BACKEND_UPSTREAM
ENV BACKEND_UPSTREAM=backend:3333

COPY nginx/templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5173
