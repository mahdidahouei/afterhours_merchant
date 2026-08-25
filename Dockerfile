FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

# dist/config.js (from public/config.js) points at dev, so a bare `docker run`
# works standalone. In k8s a per-environment ConfigMap is mounted over that path
# via subPath — that mount is the sole source of per-env API config.

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
