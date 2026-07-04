# DEV ENVIRONMENT — 개발 환경

## 요구 사항

| 도구 | 버전 | 비고 |
|---|---|---|
| Node.js | ≥ 22 | 개발 머신 24.13 |
| pnpm | ≥ 10 | `packageManager` 필드로 고정(10.28.0) |
| Docker | 최신 | P2부터 로컬 Postgres용 (`docker compose up db`) |
| Python + uv | 3.12+ | P6 PPTX 파서 서비스만 해당 |

## 최초 셋업

```bash
git clone https://github.com/JaylenAI/Im-PPT-Generator.git
cd Im-PPT-Generator
pnpm install
cp .env.example .env       # 키 채우기 (아래 표)
docker compose up -d db    # 로컬 Postgres (호스트 5433). P2부터 필요
pnpm test                  # 전체 그린 확인
```

## 셀프호스트 (오픈소스 배포 — ADR-006)

```bash
cp .env.example .env       # ANTHROPIC_API_KEY 등 채우기
docker compose up          # app + web + postgres 전체 (P2에서 app/web 서비스 배선)
# → http://localhost:3000
```
프로덕션에서 외부 Postgres를 쓰려면 `.env`의 `DATABASE_URL`만 교체.

## 환경 변수 (.env)

| 변수 | 필요 시점 | 발급처 |
|---|---|---|
| `ANTHROPIC_API_KEY` | P1 (생성 파이프라인) | console.anthropic.com |
| `TAVILY_API_KEY` | P3 (딥서치) | tavily.com |
| `SERPER_API_KEY` | P3 (검색 폴백) | serper.dev |
| `FIRECRAWL_API_KEY` | P3 (스크레이핑) | firecrawl.dev |
| `PEXELS_API_KEY` | P8 (스톡 이미지) | pexels.com/api |
| `GOOGLE_API_KEY` | P8 (이미지 생성) | aistudio.google.com |
| `DATABASE_URL` | P2 (DB) | 기본값=docker-compose 로컬 Postgres. 셀프호스트 시 외부 URL |
| `WORKSPACE_ID` | P2 (격리) | 기본 `default` (단일 사용자) |

규칙: **`.env`는 절대 커밋 금지**(gitignore 처리됨), 새 변수 추가 시 `.env.example`과 이 표를 동시 갱신. 코드에서 `process.env` 직접 접근 금지 — `apps/api/src/config/env.ts`의 zod 카탈로그에만 추가.

## 상시 명령어

```bash
pnpm dev          # 전체 dev 서버 (turbo)
pnpm test         # 전체 테스트
pnpm typecheck    # 전체 타입 검사
pnpm lint         # 린트
pnpm format       # prettier 일괄
pnpm -F @im-ppt/schema test   # 특정 패키지만
```

## 워크스페이스 구조

```
apps/
  api/          @im-ppt/api    — Hono API 서버 (PORT=8788)
  web/          @im-ppt/web    — TanStack Start (P1, flow-deck-creator 편입)
packages/
  schema/       @im-ppt/schema — zod SSOT (의존성 zod뿐 — 최하층)
  templates/    (P1)  core/ (P1)  renderer/ (P1)  exporter/ (P1)
  research/     (P3)  db/ (P2)
services/
  pptx-parser/  (P6) python-pptx 파서 — uv 관리
```

의존 방향(위반 금지): `schema ← templates/renderer/exporter/research/db/core ← api/web`. 순환 의존 금지, DB 접근은 `packages/db`만.
