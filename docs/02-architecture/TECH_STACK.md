# TECH STACK — 기술 스택 선정

> 원칙: 팀 역량(기존 검증 스택 재사용) · 프로젝트 적합성 · 확장성 · 비용.

## 확정 스택

| 영역 | 기술 | 선택 이유 |
|---|---|---|
| 모노레포 | pnpm workspace + turbo | Im-Shorts-Creator에서 검증. 패키지 경계=아키텍처 경계 |
| 언어 | TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | 스키마 SSOT와 타입 추론 일체화 |
| 스키마/검증 | **zod v4** | LLM 출력 계약+API 검증+타입 단일화. ⚠️ v4 함정: `.default()`는 기본값 재파싱 안 함 → 내부 기본값 필요 시 `.prefault()` |
| API 서버 | **Hono** (@hono/node-server) | 경량, 앱 팩토리로 테스트 용이(app.request), SSE 지원, 레퍼런스 3프로젝트 패턴 이식 용이 |
| 웹 | **TanStack Start** (React 19 + Vite) | flow-deck-creator 채택([ADR-008](ADR-008-frontend-tanstack-adopt.md)). 우리 목표 화면이 이미 작동. 헤드리스라 프레임워크 저위험 |
| 웹 UI 킷 | shadcn/ui + Tailwind v4(oklch) | flow-deck-creator에서 이식(50 컴포넌트 + 디자인 토큰) |
| DB | **Postgres 16** (순수, docker-compose 제공) | 잡큐(FOR UPDATE SKIP LOCKED)+JSONB 덱 저장. 오픈소스/Docker 셀프호스트 목표 → Supabase 스택 종속 제거 ([ADR-006](ADR-006-postgres-selfhost.md)) |
| DB 접근 | **Drizzle ORM + node-postgres(pg)** | 타입 안전 쿼리+마이그레이션(drizzle-kit). 벤더 SDK 비종속, `packages/db`에 격리 |
| LLM | **Claude API 우선** + 프로바이더 레지스트리(작업별 라우팅) | 구조화 JSON 생성/한국어 품질. 레지스트리로 벤더 비종속 |
| 검색 | Tavily(기본) + Serper(폴백) + Firecrawl(본문) | [TECHNOLOGY_RESEARCH](../01-research/TECHNOLOGY_RESEARCH.md) §4 |
| PPTX 생성 | **PptxGenJS** | JS 생태계 표준, 스키마→네이티브 요소 매핑 |
| PPTX 파싱 | python-pptx (P6, 별도 파서 서비스) | 마스터/레이아웃/placeholder 읽기는 python-pptx가 유일하게 성숙 |
| 패키징/배포 | **Docker + docker-compose** (오픈소스 셀프호스트) | `docker compose up` 원커맨드 실행. Presenton 노선. app+web+postgres 단일 스택 |
| 이미지 | Gemini 이미지 생성 + Pexels 스톡 폴백 | 단가 관리(덱당 $2 이하) |
| 테스트 | vitest(단위/통합) + Playwright(E2E) | 프로젝트 표준 |
| 스타일 | Tailwind CSS v4 + Stitch 디자인 토큰 | [DESIGN_SYSTEM](../04-design/DESIGN_SYSTEM.md) |

## 검토했지만 선택하지 않은 것

| 기술 | 미선택 이유 |
|---|---|
| HTML 자유 렌더 → html2pptx | export 충실도 통제 불가 — Gamma/Genspark의 고질 문제 재생산 ([ADR-001](ADR-001-json-schema-ssot.md)) |
| fabric.js / konva / tldraw 캔버스 에디터 | canvas 기반은 리치텍스트·반응형 불리, tldraw는 상용 라이선스 키 필요. DOM 절대좌표가 PPTX 좌표계와 정합 |
| Presenton 통째 포크 | Python(FastAPI)+Next 혼합 스택 — 유지보수 이원화. 구조(레이아웃=컴포넌트+Zod)만 차용 |
| PPTist 코드 반입 | AGPL 계열 — 상용화 시 소스 공개 의무. 설계 참고만 |
| NestJS / Express | Hono 대비 무겁고, 팀 검증 스택 아님 |
| MongoDB | 잡큐/트랜잭션은 Postgres가 정답 |
| **Supabase** | 오픈소스/Docker 셀프호스트 목표와 상충 — 자체 호스팅 스택이 무겁고(Kong/GoTrue/Realtime 등 다수 컨테이너) 설치 장벽↑. 필요한 건 Postgres+잡큐뿐이고 멀티테넌트 RLS는 Won't Have. 순수 Postgres로 대체 ([ADR-006](ADR-006-postgres-selfhost.md)) |
| LangChain/LlamaIndex | 파이프라인이 단순 명령형으로 충분 — 추상화 비용 > 이득 |
| officegen, docxtemplater, Aspose | 사망/부적합/고비용 ([TECHNOLOGY_RESEARCH](../01-research/TECHNOLOGY_RESEARCH.md) §2) |

## 버전 기준선 (2026-07-03)

Node ≥22 (개발 머신 24.13) · pnpm 10.28 · TypeScript ^5.8 · zod ^4 · Hono ^4.8 · vitest ^3.2 · turbo ^2.5
