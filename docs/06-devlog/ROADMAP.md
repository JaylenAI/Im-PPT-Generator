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

## P3 — 딥리서치 + 할루시네이션 제로 🔄 (데이터 파이프라인 완료)

- ✅ `packages/research`: 검색 어댑터(Tavily/Serper, 키 주입) + URL 본문 fetch(태그 스트립) + 유저 입력(URL/텍스트) 동일 스키마 수용. leaf 패키지(LLM 콜백 주입, 순환 의존 없음)
- ✅ 팩트 추출(소스ID 부착, 지어낸 출처 폐기, pending 상태) — 실 claude로 유저 텍스트→5팩트 추출 검증
- ✅ 인용 전파: 팩트→아웃라인 `factIds`→슬라이드 `citationIds`→덱 `citations`. buildCitations(참조 소스만 번호부여). 실 E2E: 통계 팩트가 stat/chart 슬라이드에 배정+인용 역추적 무결성 검증
- ✅ 워커 리서치 오케스트레이션(researchMode off/user_only/web/deep) + api 배선(user sources 요청, 잡 영속)
- ❌ **팩트 승인 게이트 UI**(Stitch `ai_2`: 승인/거절, Approve All, 출처 링크) — P3b
- ❌ **소스 매니저 화면** + 출처 각주/출처 슬라이드 렌더 — P3b
- ❌ 원클릭 팩트체크(근거 강/약 플래깅) — P3b
- 검증: 웹 검색은 실 키 필요(Tavily/Serper). 유저 자료 경로는 실 claude E2E 완료

## P4 — HITL 완성 + 페이지 단위 AI 수정 🔄 (백엔드 게이트 완료)

- ✅ **페이지 단위 AI 수정**: 에디터 Copilot에 지시 → 해당 페이지만 재생성(레이아웃 유지, 다른 페이지 불변). core `editSlide`/`replaceSlide`, POST /decks/:id/slides/:slideId/regenerate. 실 claude E2E 검증. NotebookLM식
- ✅ AI Copilot 챗 패널(flow-deck-creator `ai_1` 구조): 선택 슬라이드 수정 실작동(진행 표시)
- ✅ **슬라이드별 계획 게이트 백엔드**(시장 공백 = 핵심 차별화): core `generatePlans`(섹션별 designIntent+contentSummary), POST /decks/outline·/decks/plans 미리보기, POST /decks가 승인된 아웃라인+research 재사용. 실 claude E2E(피치덱 4슬라이드 계획 보고→승인→생성)
- ✅ 생성 콘텐츠 품질 버그 봉합(QA): slide_system이 일부 필드에 메타 설명("~작성 완료","레이아웃에 맞춰 구성")을 넣던 잠복 버그 → 프롬프트 예시 + closing 레이아웃 필드 `.describe()`로 최종 문구만 출력
- ✅ **게이트 승인 위저드 UI**(P4b): create 플로우가 프리셋별 게이트 오케스트레이션 — quick=스트림, 표준/내자료=목차 게이트, 정밀=목차+슬라이드별 계획 게이트. OutlineGate(편집/삭제)+PlanGate(의도/내용 카드)+소스 입력(URL/텍스트). **Playwright 하네스 구축** + 실 claude 게이트 흐름 브라우저 E2E 2건 그린
- ❌ 자율도 L0~L3 세부 UI, 레이아웃 스왑, 문맥 맞춤 단일 슬라이드 삽입, 딥서치 탭 — 후속

## P5 — WYSIWYG 에디터 심화 🔄 (인라인 편집 완료)

- ✅ **텍스트 인라인 편집**: 편집 모드에서 캔버스 텍스트/리스트를 contentEditable로 직접 수정(블러 커밋, 불변 갱신), 요소 선택 아웃라인. 저장 버튼→PATCH /decks/:id 영속. 렌더러 `EditHandlers` 계약.
- ✅ **QA로 잡은 버그**: 에디터 canvas 너비 측정(useWidth)이 마운트 시 로딩UI라 ref null→observer 미부착→직접URL/새로고침 시 캔버스 미렌더. 콜백 ref로 봉합.
- ✅ **속성 패널 + undo/redo**(P5b): 요소 선택 시 위치(x/y/w/h)·텍스트 색상/폰트크기 폼 편집 + 요소 삭제. 히스토리 스택 undo/redo. Playwright E2E(선택→삭제→undo/redo→저장 영속)
- ✅ **요소 드래그/리사이즈**(P5c): 선택 박스(이동 핸들+리사이즈 핸들), 화면 델타→캔버스 좌표 변환(scale), 드래그 중 라이브 갱신+종료 시 히스토리 커밋. window 리스너 패턴. Playwright E2E(드래그→위치 변경→저장 영속)
- ✅ 검증: Playwright 편집 E2E 4건(인라인 수정·속성 패널·발표·드래그)
- ❌ 요소 추가 툴바, z-order, 정렬 스냅, 오버플로 자동 수정 — 후속

## P6 — 템플릿 시스템 + 브랜드킷 🔄 (브랜드킷 완료)

- ✅ **브랜드킷**: 팔레트/폰트 → 테마 토큰 부분 오버라이드. `brandKitSchema`+`mergeBrandKit`, 덱이 자기 테마 소유(`deck.themeOverride` 인라인 토큰 — 정적 레지스트리 불변, 동적 저장 인프라 불필요). 설정 DB 영속+생성 시 적용. 웹 brand-kit 화면 실작동. 실 E2E(설정→생성 시 override 적용→재시작 영속)
- ✅ **유저 PPTX 업로드 → 테마 추출**: jszip으로 theme1.xml clrScheme 파싱 → accent1/2·dk1/2·lt1을 브랜드 색상으로 매핑 → 브랜드킷 설정. POST /settings/brand-kit/from-pptx, 웹 brand-kit 업로드 버튼. 실 E2E(python-pptx Office 테마 5색 추출→생성 적용)
- ❌ 템플릿 갤러리 15종+ (현재 빌트인 2종), 로고 업로드, 커스텀 템플릿 저장, 덱 복제

## P7 — 입력 확장 🔄 (문서 업로드 완료)

- ✅ **문서 업로드 → 덱**: DOCX(mammoth)/TXT/MD 파싱 → 텍스트 추출 → user_text 소스로 리서치 파이프라인 재사용. POST /documents/extract(멀티파트, 10MB 제한, 미지원 형식 거부). 웹 create에 업로드 버튼. 실 E2E(txt/md/docx 추출 + 브라우저 업로드→소스 추가)
- ✅ URL/텍스트 붙여넣기(기존 user_url/user_text 소스)
- ❌ PDF 파싱(파서 추가 필요), 장문 3모드(condense는 P10 리라이트로 부분 대체), CSV/Excel→차트, Guide Mode

## P8 — 이미지/차트 고도화 🔄 (다이어그램 착수)

- ✅ 차트 export 확인: 7종 차트(bar/line/pie/donut 등)가 PptxGenJS native chart로 export(기존 배선)
- ✅ **프로세스 다이어그램 레이아웃**: 순차 단계를 카드+화살표로(2~5단계). LLM 선택 가능. 실 E2E(로드맵 프롬프트→process 선택→PPTX 유효 export)
- ✅ **슬라이드당 디자인 변형 N개**: `generateVariants` — 슬라이드 제목/요약을 뽑아 다른 콘텐츠 레이아웃 3종으로 병렬 재생성. POST /decks/:id/slides/:slideId/variants. 실 claude E2E(bullets→two-col/stat/quote)
- ❌ AI 이미지 생성(Gemini/DALL-E, 키 필요) + Pexels 스톡 폴백
- ❌ 차트 고도화(워터폴/Mekko), 추가 다이어그램(퍼널/타임라인/조직도/2×2)

## P9 — 발표 + 출력 확장 🔄 (발표 모드 완료)

- ✅ **발표 모드**: 전체화면 슬라이드 + 키보드 네비(←/→/Space/Esc) + 뷰포트 비율 유지 스케일 + 발표자 노트 토글(N키). Playwright E2E(열기→네비→종료)
- ✅ **화면비 4:3/9:16 전 파이프라인 스윕**: `defineLayout`이 기준 1280×720로 빌드 후 타깃 캔버스로 프레임/폰트 비례 리매핑(레이아웃 코드 무변경, 16:9 하위호환). 렌더러·exporter는 이미 CANVAS_SIZES 기반. 생성 위저드 화면비 선택. 실 E2E(9:16 생성 시 전 요소 720×1280 안+PPTX 세로 크기 export)
- ❌ 발표자 뷰(다음 슬라이드 미리보기), AI 스피커 노트 생성, PNG export(헤드리스 렌더), 웹 링크 퍼블리싱

## P10 — AI 부가 + 플랫폼 🔄 (접근성 검사 완료)

- ✅ **접근성 검사(시장 공백)**: `checkAccessibility` — 텍스트 대비율 WCAG AA(4.5:1) + 이미지 alt 점검, 색 배경만 대비 계산(그라디언트/이미지 배경 스킵). GET /decks/:id/accessibility. 실 덱 검증(빌트인 테마 100점 확인)
- ✅ **덱 번역**(전 슬라이드 일괄): `translateDeck` — 슬라이드별 텍스트 수집→번역→순서대로 재적용(레이아웃/좌표 불변), 개수 불일치 시 원문 유지. 원본 보존(새 덱). POST /decks/:id/translate. 실 claude E2E(한국어→영어, 구조 동일)
- ✅ **덱 리라이트**(톤/길이): `rewriteDeck` — 지시("더 간결하게" 등)를 전 슬라이드에 적용, 구조 불변. POST /decks/:id/rewrite. 실 claude E2E(간결화 확인). translate와 transformSlide 공용
- ✅ **MCP 서버**(신흥 표준): `apps/mcp` — generate_deck·list_layouts 도구를 stdio로 노출. Claude Desktop 등 MCP 클라이언트가 프레젠테이션 생성 가능(claude CLI 구독, 무키). 실 검증(SDK Client 스폰→tools/list→generate_deck 실 claude 3슬라이드)
- ❌ 조회 애널리틱스, 예상 질문 생성
- ❌ 조회 애널리틱스, 예상 청중 질문 생성
- ❌ 생성 REST API 문서화/웹훅, MCP 서버(신흥표준)
- 참고: 생성 REST API 자체는 P1~P5로 대부분 구현됨(헤드리스 계약)

## 이후 후보 (v2)

- 나레이션 MP4 export(보이스 클론), AI 리허설 코치, 라이브 데이터 커넥터/Snapshots, 배치 개인화, Skills 패키지 마켓, 실시간 공동편집(CRDT), 딜룸
