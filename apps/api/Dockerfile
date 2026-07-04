# im-ppt API — 헤드리스 생성 백엔드(Hono + tsx 런타임)
# 빌드 산출물(dist)이 없는 tsc --noEmit 프로젝트라 tsx로 실행한다.
# 생성은 claude CLI(`claude -p`)를 spawn — 구독 인증(~/.claude 마운트) 또는
# ANTHROPIC_API_KEY 환경변수 중 하나가 있어야 실제 생성이 동작한다.
FROM node:22-slim
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate \
 && npm i -g @anthropic-ai/claude-code && npm cache clean --force
WORKDIR /app

# 워크스페이스 매니페스트 먼저 복사 → 의존성 설치 레이어 캐시(소스 변경 시 재설치 회피)
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

# 소스 복사(런타임 tsx 실행 — 별도 빌드 없음)
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787
WORKDIR /app/apps/api
CMD ["node", "--import", "tsx", "src/index.ts"]
