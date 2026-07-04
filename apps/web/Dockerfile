# im-ppt Web — TanStack Router SPA(vite 빌드) → nginx 정적 서빙
# nginx가 /api를 app 서비스로 프록시(SSE 버퍼링 off)해 동일 오리진으로 노출.
FROM node:22-slim AS build
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/schema/package.json ./packages/schema/
COPY packages/templates/package.json ./packages/templates/
COPY packages/core/package.json ./packages/core/
COPY packages/exporter/package.json ./packages/exporter/
COPY packages/renderer/package.json ./packages/renderer/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm --filter @im-ppt/web build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 3000
