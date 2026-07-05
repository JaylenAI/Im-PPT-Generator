# Im PPT Generator

**End-to-End AI 프레젠테이션 에이전트** — 발표 유형 선택(PT면접·IR·컨설팅 등 10종)과 자료조사(딥서치+출처 검증)부터 목차 설계, 슬라이드별 디자인 계획 보고/승인(HITL), 실시간 생성 스트리밍, 수동 편집, 품질 진단·자동 수정, PPTX/PDF export까지 전 과정을 수행하는 AI Agent 플랫폼.

## 핵심 설계 원칙

1. **슬라이드 JSON 스키마 = 단일 진실(SSOT)** — `packages/schema`(Zod). 웹 렌더러·에디터·PPTX 익스포터·LLM 출력 계약이 모두 같은 스키마를 공유한다.
2. **AI는 디자인하지 않는다. 고르고 채운다** — 검증된 레이아웃 변형(templates) 중 선택 + 스키마 검증된 콘텐츠 생성. 오버플로/불균형 방지의 핵심.
3. **할루시네이션 제로** — 모든 팩트는 소스 ID로 역추적, 팩트 승인 게이트 통과분만 슬라이드에 반영.
4. **HITL 3게이트** — ① 리서치 팩트 승인 → ② 아웃라인 승인 → ③ 슬라이드별 계획 승인(자율도 레벨로 조절).
5. **의미 단위 SSE 스트리밍** — `slide_delta` 이벤트로 슬라이드가 실시간으로 그려지는 UX.
6. **콘텐츠 품질은 데이터로 제어** — 발표 유형·서사 골격·품질 규칙을 카탈로그(SSOT)로 표현. 확장 = 배열 항목 추가(코드 분기 없음).

## 콘텐츠 품질 (딥리서치 기반)

프레젠테이션 이론(Minto Pyramid·Alley Assertion-Evidence·McKinsey)을 코드화한 품질 레버:

| 기능 | 설명 | ADR |
|---|---|---|
| **Action Title** | 슬라이드 제목 = 짧은 라벨이 아니라 완결된 결론 문장(assertion). 제목만 읽어도 스토리가 됨(Ghost Deck 검증) | [ADR-009](docs/02-architecture/ADR-009-action-titles.md) |
| **발표 유형 10종** | PT면접(STAR)·컨설팅(SCQA)·IR(Kawasaki)·학술(IMRaD)·세일즈(PAS)·교육·워크숍·실적보고·제품데모·일반. 장르별 서사 골격+톤+**자동 테마 매칭** | [ADR-010](docs/02-architecture/ADR-010-presentation-types.md) |
| **데이터 스토리텔링** | 차트 핵심 수치 강조(highlightIndex)·인사이트 주석·레이아웃 리듬 | [ADR-011](docs/02-architecture/ADR-011-data-storytelling.md) |
| **Deck Doctor** | 슬라이드 품질 진단(6x6·텍스트 과밀·데이터 스토리 누락) + **AI 자동 수정**(생성→진단→개선 루프) | [ADR-012](docs/02-architecture/ADR-012-deck-doctor.md) |
| **템플릿 라이브러리 113종** | 스타일팩 16 + design-diversity 60 + reveal.js/Marp/Catppuccin 21(전부 MIT 반입). 색·폰트 정체성 + 팩 폰트 웹 로딩 | [TEMPLATE_SYSTEM](docs/02-architecture/TEMPLATE_SYSTEM.md) |
| **디자인 시스템 엔진 10종** | 색을 넘어 골격까지 차별화 — 대문자 헤딩·타이틀 액센트·배경(grid/ruled/gradient/watermark)·카드 보더를 `decorate` 후처리로 전 레이아웃에 일괄 적용 | [TEMPLATE_SYSTEM](docs/02-architecture/TEMPLATE_SYSTEM.md) |

**확장 예시**: 발표 유형 추가는 `packages/schema/src/presentation-type.ts`의 `PRESENTATION_TYPES` 배열에 항목 하나를 더하면 outline 스캐폴드·테마 매칭·선택기 UI에 자동 반영된다.

## 구조

```
apps/
  api/          Hono API 서버 (도메인 라우터 분리, 표준 {data}/{error} 봉투)
  web/          TanStack Router SPA (생성 위저드·HITL 게이트·WYSIWYG 에디터·발표 모드)
  mcp/          MCP 서버 (@modelcontextprotocol/sdk — generate_deck/list_layouts 등)
packages/
  schema/       Zod 슬라이드/덱/이벤트/발표유형 스키마 — SSOT
  core/         파이프라인 오케스트레이터 + 프롬프트 카탈로그 + LLM 프로바이더 레지스트리
                + 품질 도구(ghost-deck/doctor/doctor-fix)
  templates/    테마 113종(디자인 토큰) + 디자인 시스템 10종(decorate) + 레이아웃 변형 카탈로그
  renderer/     React 슬라이드 렌더러 (웹 표시/편집 공용)
  exporter/     PptxGenJS/PDF 익스포터
  research/     딥서치 + 스크레이핑 + citation 추적
  db/           순수 Postgres + Drizzle 데이터 계층 — 덱/잡 영속 (다른 곳에서 DB 직접 접근 금지)
```

> 아키텍처: API-First 헤드리스([ADR-007](docs/02-architecture/ADR-007-api-first-headless.md)) — 웹은 표현만, 모든 도메인 로직은 packages(HTTP 무지)에. 프론트를 교체해도 API 계약만 지키면 전 기능 동작.

## 개발

```bash
pnpm install
docker compose up -d db   # 로컬 Postgres(호스트 5433)
pnpm test                 # 전체 테스트
pnpm typecheck            # 타입 검사
pnpm dev                  # 개발 서버(api :8788, web :5273)
```

- 요구사항: Node >= 22, pnpm >= 10
- 환경변수: `.env.example` 참고 (`.env`는 커밋 금지)

## 셀프호스트 (Docker)

전체 스택(Postgres + API + Web)을 한 번에 실행:

```bash
docker compose up          # http://localhost:3000
```

- **웹**: `http://localhost:3000` (nginx가 `/api`를 API로 프록시, SSE 지원)
- **API**: `http://localhost:8788` (헤드리스, 직접 호출 가능)
- **생성 인증**: 컨테이너는 `claude -p`로 생성한다. 아래 중 하나 필요:
  - **API 키(권장)**: 루트 `.env`에 `ANTHROPIC_API_KEY=...` → compose가 자동 주입
  - **구독**: `docker-compose.yml`의 `~/.claude` 마운트 주석 해제(hooks 없는 깨끗한 설정일 때만)

## 문서

- [로드맵](docs/06-devlog/ROADMAP.md) — 전체 Phase 계획과 진행 상태(품질 개선 트랙 포함)
- [현재 상태](docs/CURRENT_STATUS.md)
- [전체 문서 인덱스](docs/README.md) — 모듈별 진행률
- [아키텍처](docs/02-architecture/SYSTEM_ARCHITECTURE.md) — 시스템 구조와 데이터 흐름
- **ADR(아키텍처 결정 기록)**: [007 API-First](docs/02-architecture/ADR-007-api-first-headless.md) · [009 Action Title](docs/02-architecture/ADR-009-action-titles.md) · [010 발표 유형](docs/02-architecture/ADR-010-presentation-types.md) · [011 데이터 스토리텔링](docs/02-architecture/ADR-011-data-storytelling.md) · [012 Deck Doctor](docs/02-architecture/ADR-012-deck-doctor.md)
