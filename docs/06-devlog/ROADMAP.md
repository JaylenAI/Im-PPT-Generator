# Im PPT Generator 로드맵

> 상태: ❌ 미개발 → 🔄 진행중 → ✅ 완료. 각 Phase는 feature 브랜치 → dev 머지, phase별 실데이터 E2E + QA 후 커밋.
> 기능 기준: [경쟁 제품 매트릭스](../01-research/COMPETITIVE_ANALYSIS.md)의 Must-have 전체 + 시장 공백(슬라이드별 계획 승인, 인용 구조 관리) 선점.
> 🚫 보류(별도 승인 필요): SaaS(인증/결제/크레딧/멀티테넌트), 실시간 다인 공동편집(CRDT).

## P0 — 기반: 모노레포 + 스키마 SSOT 🔄

- ✅ pnpm+turbo+TS strict 모노레포, prettier/eslint
- ✅ `packages/schema`: 덱/슬라이드/요소 7종/테마 토큰/리서치(소스→팩트→인용)/아웃라인/템플릿/SSE 이벤트 계약 (단위 14)
- ✅ `apps/api`: Hono 스켈레톤(앱 팩토리, zod env, 구조화 로거, 표준 에러 포맷) (단위 4)
- 🔄 첫 커밋 + dev 분기 (사용자 확인 대기)

## P1 — 세로 슬라이스 MVP: 프롬프트→아웃라인→생성→렌더→PPTX ✅ 완료(2026-07-04)

- `packages/templates`: 테마 2종(Stitch 토큰 이식) + 레이아웃 변형 8종(title/agenda/bullets/two-col/stat/quote/chart/closing) — 레이아웃=코드, AI는 선택+채움만
- `packages/core`: 프롬프트 카탈로그(prompts-as-data) + LLM 프로바이더 레지스트리(작업별 라우팅, Claude 우선) + 아웃라인 생성 + 슬라이드 JSON 생성(스키마 검증 실패 시 재시도 루프)
- `packages/renderer`: React 절대좌표 렌더러(읽기 전용, 토큰 해석 `token:colors.*`)
- `packages/exporter`: PptxGenJS 매핑(텍스트/리스트/이미지/도형/차트/표) + PDF
- `apps/web`: **flow-deck-creator 편입**(TanStack Start, ADR-008) — 가짜 로직 4개(generation/SlideView/export/store)를 우리 API·렌더러·익스포터로 교체. 디자인 토큰(인디고/시안 이원 액센트, Geist+Inter+JetBrains Mono, 글래스) + 대시보드 + 생성 위저드(프롬프트→옵션: 장수/톤/청중/언어) + 아웃라인 승인 화면 + 덱 뷰어 + PPTX/PDF 다운로드
- 검증: 실 API로 덱 1개 관통 E2E(Playwright) + exporter 스냅샷 테스트 + LibreOffice 렌더 육안 QA

## P2 — 영속화 + 잡 인프라 + 실시간 스트리밍 ✅ 완료(2026-07-04)

- ✅ `packages/db`: 순수 Postgres + Drizzle ORM ([ADR-006](../02-architecture/ADR-006-postgres-selfhost.md)) — decks JSONB + `workspace_id` 격리, PgDeckStore/MemoryDeckStore 공통 인터페이스, ensureSchema(advisory lock으로 동시 부팅 DDL 레이스 방지). 실 PG 통합 + 서버 재시작 E2E 검증
- ✅ SSE 스트리밍: `outline_ready/slide_started/slide_done/deck_done/deck_saved` — **AI가 슬라이드를 실시간으로 만드는 뷰**(웹 활동 로그+진행바). 실 claude 이벤트 흐름 검증
- ✅ Postgres 잡큐(`FOR UPDATE SKIP LOCKED`+지수백오프) — 생성 detach(POST /decks/generate) + 재접속 이벤트 재생(GET /jobs/:id/stream, 잡 로그 영속). 오래 잠긴 running 재클레임(크래시 복구). 실 claude E2E: 서버 재시작 후 12 이벤트 전체 재생·덱 영속
- ✅ Docker 패키징: app/web Dockerfile + docker-compose 전체 스택(`docker compose up`) — nginx가 /api 프록시(SSE) + SPA 폴백. 오픈소스 셀프호스트. 두 이미지 빌드→스택 기동→서빙/프록시 실검증
- ✅ 동적 설정 카탈로그(타입드 카탈로그→zod 파생→설정 UI→DB KV→핫리로드) — APP_SETTINGS_CATALOG + SettingsService(부팅 hydrate). 실 E2E: PATCH→재시작 영속→앱 기본값이 미지정 생성에 반영

## P3 — 딥리서치 + 할루시네이션 제로 ❌

- `packages/research`: 검색 어댑터(Tavily 기본/Serper 폴백) + 스크레이핑(Firecrawl/Jina) + 유저 입력(URL/텍스트/문서) 동일 스키마 수용
- 팩트 추출(소스 ID 부착) → **팩트 승인 게이트 UI**(Stitch `ai_2` 디자인: 승인/거절, Approve All, 출처 링크)
- 인용 전파: 팩트→아웃라인→슬라이드 요소 `citationId` → 출처 각주/출처 슬라이드 렌더 + **소스 매니저 화면**(시장 공백 선점)
- 원클릭 팩트체크(근거 강/약 플래깅) — Genspark 단독 기능 카피
- 검증: 실 검색 API 통합 테스트 + 인용 역추적 E2E

## P4 — HITL 완성 + 페이지 단위 AI 수정 🔄 (일부 완료)

- ✅ **페이지 단위 AI 수정**: 에디터 Copilot에 지시 → 해당 페이지만 재생성(레이아웃 유지, 다른 페이지 불변). core `editSlide`/`replaceSlide`, POST /decks/:id/slides/:slideId/regenerate. 실 claude E2E 검증. NotebookLM식
- ✅ AI Copilot 챗 패널(flow-deck-creator `ai_1` 구조): 선택 슬라이드 수정 실작동(진행 표시)
- ❌ **슬라이드별 계획 승인 게이트**(시장 공백 = 핵심 차별화): 페이지마다 디자인 의도+내용 요약 보고 → 승인 후 생성
- ❌ 자율도 레벨 L0~L3 UI(스키마 GenerationConfig는 P0 완료, UI 미배선)
- ❌ 레이아웃 스왑, 문맥 맞춤 단일 슬라이드 삽입, 딥서치 탭 실배선
- 잔여 검증: 게이트 3종(팩트/아웃라인/계획) 풀루프 E2E

## P5 — WYSIWYG 에디터 심화 ❌

- 요소 선택/드래그/리사이즈/회전, 텍스트 인라인 편집, 속성 패널(우측: Copilot과 탭 전환)
- 요소 추가 툴바(텍스트/이미지/도형/차트/표/아이콘), z-order, 정렬 가이드/스냅
- 오버플로 자동 수정(폰트 메트릭 계측 → 단계 축소) — 렌더러/익스포터 공용
- undo/redo + 버전 히스토리(스냅샷/복원)
- 검증: 에디터 상호작용 Playwright 스위트

## P6 — 템플릿 시스템 + 브랜드킷 ❌

- 템플릿 갤러리(Stitch `_2`): 카테고리/비율/컬러 필터, 15종+ 확장
- 브랜드킷: 로고/팔레트/폰트 → 테마 토큰 오버라이드
- **유저 PPTX 업로드 → 테마/레이아웃 제한적 추출**(python-pptx 파서 서비스 or Presenton 방식, placeholder 기반 v1)
- 커스텀 템플릿 저장(내 템플릿), 기존 덱 복제→변형
- 검증: 실 PPTX 샘플 5종 추출 통합 테스트

## P7 — 입력 확장 ❌

- PDF/DOCX/MD 업로드 → 덱 (파싱→팩트 파이프라인 재사용)
- 장문 붙여넣기 3모드(generate/condense/**preserve** — Gamma 카피)
- URL/웹페이지 임포트, 기존 PPTX 콘텐츠 임포트, CSV/Excel → 차트
- Guide Mode(청중/목적/구조 사전 인터뷰 — Genspark 카피)
- 검증: 입력 모드별 실파일 E2E

## P8 — 이미지/차트 고도화 ❌

- AI 이미지 생성(프로바이더 레지스트리: Gemini 이미지/DALL-E) + Pexels 스톡 폴백 혼합(단가 관리)
- 차트 고도화: 컨설팅급(워터폴/Mekko — 시장 공백), 다이어그램(퍼널/타임라인/조직도/2×2)
- 슬라이드당 디자인 변형 N개 제시→선택(Alai 카피)
- 검증: 이미지 파이프라인 통합 + 차트 export 충실도 스냅샷

## P9 — 발표 + 출력 확장 ❌

- 발표 모드 + 발표자 뷰(노트+다음 슬라이드) + AI 스피커 노트(문맥형 — Manus 수준)
- 화면비 4:3/9:16 전 파이프라인 스윕, PNG export, 웹 링크 퍼블리싱(읽기 전용 공유)
- 검증: 비율별 렌더/export 스냅샷 + 발표 모드 E2E

## P10 — AI 부가 + 플랫폼 ❌

- 덱 번역(전 슬라이드 일괄), 요약/확장/톤 리라이트, 접근성 검사(대비/알트텍스트 — 시장 공백)
- 조회 애널리틱스(공유 링크 슬라이드별 체류), 예상 청중 질문 생성
- 생성 REST API(+웹훅) 및 MCP 서버(신흥표준)
- 검증: 전체 회귀 E2E + 성능/비용 계측

## 이후 후보 (v2)

- 나레이션 MP4 export(보이스 클론), AI 리허설 코치, 라이브 데이터 커넥터/Snapshots, 배치 개인화, Skills 패키지 마켓, 실시간 공동편집(CRDT), 딜룸
