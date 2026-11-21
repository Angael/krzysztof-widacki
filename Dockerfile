FROM oven/bun:1.4.5-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginxinc/nginx-unprivileged:1.31.7-alpine
USER root
RUN apk upgrade --no-cache && (apk del --no-cache chromium chromium-browser 2>/dev/null || true)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html
USER 101
EXPOSE 8080
