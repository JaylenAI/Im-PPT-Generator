# REST API 명세 (v1 — 구현 반영)

> Base: `/api/v1` · 응답 포맷: 성공 `{ "data": ... }` / 실패 `{ "error": { "code", "message" } }` · 모든 입력은 zod 검증.
> 이 문서는 **실제 구현된 엔드포인트**를 반영한다(2026-07-04 기준). 계약 스키마는 `@im-ppt/schema` 재사용.

## Health

| Method | Path | 설명 |
|---|---|---|
| GET | `/health` | 서버 상태 |

## Decks — 생성

| Method | Path | 설명 |
|---|---|---|
| POST | `/decks` | 동기 생성. 바디 = **GenerationConfig**(`{prompt, preset?, slideCount?, tone?, audience?, language?, aspectRatio?, presentationType?, researchMode?, outlineSource?, titleMode?, templateId?, themeId?, imageMode?, gates?}` + 선택 `sources[]`, `outline?`, `research?`) → `{deckId, deck, costUsd}` |
| POST | `/decks/stream` | **SSE 실시간 생성** — `job_started`/`outline_ready`/`slide_started`/`slide_done`/`deck_done`/`deck_saved`/`job_error` 이벤트 |
| POST | `/decks/generate` | 잡 detach 생성 → `{jobId}` |
| POST | `/decks/from-csv` | CSV 텍스트 → 차트 덱 `{csv, title?, chartType?}` → `{deckId, deck}` |

## Decks — 조회/편집

| Method | Path | 설명 |
|---|---|---|
| GET | `/decks` | 덱 목록 |
| GET | `/decks/:id` | 덱 전체 JSON |
| PATCH | `/decks/:id` | 덱 전체 저장(WYSIWYG 편집 결과, `deckSchema` 검증) |
| DELETE | `/decks/:id` | 삭제 |
| POST | `/decks/:id/duplicate` | 복제 → `{deckId, deck}` |

## HITL 게이트 (미리보기)

| Method | Path | 설명 |
|---|---|---|
| POST | `/decks/outline` | 아웃라인 미리보기(승인 전) → `{outline, sources, facts}` |
| POST | `/decks/plans` | 슬라이드별 계획 미리보기 → `{plans, costUsd}` |

## Jobs / Streaming

| Method | Path | 설명 |
|---|---|---|
| GET | `/jobs/:id` | 잡 상태 |
| GET | `/jobs/:id/stream` | **SSE 재생** — 재접속 시 잡 로그 이벤트 재생(크래시 복구) |

## Slides (페이지 단위)

| Method | Path | 설명 |
|---|---|---|
| POST | `/decks/:id/slides/:slideId/regenerate` | 해당 페이지만 AI 재생성 `{instruction}`(Copilot) |
| POST | `/decks/:id/slides/:slideId/variants` | 같은 내용 다른 레이아웃 3종 → `{variants:Slide[], costUsd}` |

## 품질 도구 (콘텐츠 품질 트랙)

| Method | Path | 설명 |
|---|---|---|
| GET | `/decks/:id/ghost-deck` | Ghost Deck(Titles Test) — 제목만 순서 + 논리 골격 점검(ADR-009) → `{titles, coherent, issues}` |
| GET | `/decks/:id/doctor` | Deck Doctor 진단 — 6x6·텍스트벽·차트 스토리·과밀·빈 슬라이드(ADR-012) → `{score, slideCount, clean, issues}` |
| POST | `/decks/:id/doctor/fix` | AI 자동 수정 — 진단 이슈를 editSlide로 개선 → `{deck, before, after, fixedSlides, costUsd}` |
| GET | `/decks/:id/accessibility` | 접근성(WCAG 대비율/alt) → `{score, checked, issues}` |

## AI 부가 (P10)

| Method | Path | 설명 |
|---|---|---|
| POST | `/decks/:id/speaker-notes` | 발표자 노트 생성(전 슬라이드) → `{deck}` |
| GET | `/decks/:id/questions` | 예상 청중 질문 → `{questions:string[]}` |
| POST | `/decks/:id/translate` | 전 슬라이드 번역 `{language}` → `{deckId, deck}`(새 덱) |
| POST | `/decks/:id/rewrite` | 톤/길이 리라이트 `{instruction}` → `{deckId, deck}`(새 덱) |

## 입력 / 미디어

| Method | Path | 설명 |
|---|---|---|
| POST | `/documents/extract` | 문서 업로드(PDF/DOCX/TXT/MD, 멀티파트) → `{filename, chars, text}` |
| POST | `/images/generate` | claude -p SVG 이미지 `{concept, width, height, themeId?}` → `{dataUri, chars}` |

## 카탈로그 (읽기)

| Method | Path | 설명 |
|---|---|---|
| GET | `/templates` | 템플릿 목록(빌트인 113 + 사용자/임포트 병합) |
| GET | `/templates/:id/sample` | 템플릿 미리보기 샘플 덱(갤러리 썸네일/모달) |
| POST | `/templates/from-pptx` | 사용자 PPTX 업로드 → 색·폰트 추출해 브랜드 템플릿(P6) |
| POST | `/templates/from-url` | 브랜드 사이트 URL → 색·폰트 추출해 브랜드 템플릿(P12, SSRF 방어) |
| DELETE | `/templates/:id` | 사용자/임포트 템플릿 삭제(빌트인 불가) |
| GET | `/themes` | 테마 113종 |
| GET | `/layouts` | 레이아웃 카탈로그(LLM용) — 21종(references는 시스템 자동 생성이라 제외, 레지스트리 총 22) |
| GET | `/presentation-types` | 발표 유형 10종(서사 골격+테마, ADR-010) |

## Exports

| Method | Path | 설명 |
|---|---|---|
| POST | `/decks/:id/export` | `{format:'pptx'|'pdf'|'png'}` → `{exportId, filename}` (png=슬라이드별 PNG를 zip) |
| GET | `/exports/:id/download` | 산출물 다운로드(RFC5987 한글 파일명) |

## Images (P8/P12)

| Method | Path | 설명 |
|---|---|---|
| POST | `/images/generate` | AI SVG 이미지 생성(claude) → data URI(P8) |
| GET | `/images/stock?q=&orientation=` | 스톡 사진 검색(Pexels/Unsplash). 키 없으면 `{available:false}`(P12) |
| POST | `/images/stock/fetch` | `{url}` → data URI(허용 CDN 호스트만, SSRF 방어)(P12) |

## Settings (동적 설정)

| Method | Path | 설명 |
|---|---|---|
| GET/PATCH | `/settings/app` | 앱 기본값(프리셋/슬라이드수/톤/언어/화면비/이미지모드) |
| GET | `/settings/catalog` | 타입드 설정 카탈로그(필드 정의 + 값) |
| GET | `/settings/models` | 모델 연결 + 작업 배정(읽기) → `{connections, assignments}` |
| GET | `/settings/prompts` · PATCH `/settings/prompts/:key` | 프롬프트 카탈로그 조회 / override 편집 |
| GET/PATCH | `/settings/brand-kit` | 브랜드킷(색/폰트 오버라이드) |
| POST | `/settings/brand-kit/from-pptx` | 브랜드 PPTX 업로드 → 테마 색 추출 |

## 에러 코드 규약

`NOT_FOUND` · `VALIDATION_FAILED`(zod 상세) · `NO_OUTLINE`(Ghost Deck 전 아웃라인 없음) · `PARSE_FAILED`(문서/PPTX 파싱) · `PROVIDER_ERROR`(LLM/검색 상류) · `INTERNAL`
