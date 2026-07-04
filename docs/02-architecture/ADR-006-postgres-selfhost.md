# ADR-006: 순수 Postgres + Docker 셀프호스트 (Supabase 기각)

- 상태: ✅ 확정 (2026-07-04)
- 대체: 초기 TECH_STACK의 "Supabase (Postgres)" 항목

## Context

이 프로젝트는 **오픈소스로 배포 + Docker 이미지로 셀프호스트 패키징**이 목표다(사용자 명시). 초기 설계는 ai-news-hub 재사용을 이유로 Supabase(Postgres+Auth+RLS+Realtime)를 상정했으나, 배포 형태를 다시 보면 맞지 않는다:

- 우리가 실제로 쓰는 것은 **Postgres(JSONB 덱 저장 + `FOR UPDATE SKIP LOCKED` 잡큐)** 뿐이다.
- Supabase 자체 호스팅은 Kong/GoTrue/PostgREST/Realtime/Storage 등 다수 컨테이너를 요구 → 오픈소스 사용자의 `docker compose up` 진입 장벽을 키운다.
- Supabase RLS의 주 용도인 **멀티테넌트 격리는 이미 Won't Have**(SaaS 제외). 단일 사용자/소규모 셀프호스트에는 앱 레이어 workspace 격리로 충분하다.
- Auth도 SaaS 제외 범위라 GoTrue 불필요.

## Decision

**순수 Postgres 16 + Drizzle ORM(+node-postgres) 채택.** DB 접근은 `packages/db`에 격리하고(타 패키지 직접 접근 ESLint 차단), 마이그레이션은 drizzle-kit(또는 순수 SQL)로 버전 관리한다. 배포는 `docker-compose.yml`(app + web + postgres)로 원커맨드 실행하며, 프로덕션 셀프호스트는 `DATABASE_URL`만 외부 인스턴스로 교체하면 된다.

- 격리: `WORKSPACE_ID` 컬럼 기반 앱 레이어 스코프(기본 `default`). 향후 멀티유저가 필요해지면 Postgres RLS를 이 컬럼에 얹는다(비파괴적 확장 경로 유지).
- 잡큐: Postgres 네이티브(`FOR UPDATE SKIP LOCKED` + dedup 부분 인덱스 + 지수 백오프) — 외부 큐(Redis/SQS) 불필요.

## Consequences

- (+) `docker compose up` 원커맨드 셀프호스트 — Presenton 노선, 오픈소스 채택 장벽 최소화
- (+) 벤더 종속 0, BYO-Postgres(관리형 RDS/Cloud SQL 등) 자유
- (+) 스택 단순화 — 컨테이너 3개(app/web/db)면 충분
- (−) Auth/Realtime/Storage를 직접 구현해야 함 → 단, 전부 현재 범위(Won't Have) 밖이거나 SSE(자체 구현)로 대체됨. 파일 저장(export 산출물/업로드)은 로컬 볼륨 → 향후 S3 호환 어댑터로 추상화
- (−) ai-news-hub의 Supabase 특화 코드(RLS 헬퍼, 타입 코드젠)는 재사용 불가 — 대신 Drizzle 스키마로 재작성. 잡큐/동적설정 **패턴**은 그대로 이식
