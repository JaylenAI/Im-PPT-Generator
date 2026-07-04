# REST API 명세 (v1 초안)

> Base: `/api/v1` · 응답 포맷: 성공 `{ "data": ... }` / 실패 `{ "error": { "code", "message" } }` · 모든 입력은 zod 검증.
> P1~P4에 걸쳐 구현. 이 문서가 API의 설계 정본이며, 구현 시 라우트별 스키마는 `@im-ppt/schema` 재사용.

## Health

| Method | Path | 설명 | Phase |
|---|---|---|---|
| GET | `/health` | 서버 상태 | ✅ P0 |

## Decks (덱)

| Method | Path | 설명 | Phase |
|---|---|---|---|
| POST | `/decks` | 덱 생성 시작 `{prompt, options:{slideCount,tone,audience,language,aspectRatio}, templateId?, autonomy}` → `{deckId, jobId}` | P1 |
| GET | `/decks` | 내 덱 목록(페이지네이션) | P2 |
| GET | `/decks/:id` | 덱 전체 JSON | P1 |
| PATCH | `/decks/:id` | 덱 메타 수정(제목/테마/템플릿) | P2 |
| DELETE | `/decks/:id` | 삭제 | P2 |
| POST | `/decks/:id/duplicate` | 복제→변형 | P6 |

## Outline / Gates (게이트)

| Method | Path | 설명 | Phase |
|---|---|---|---|
| PUT | `/decks/:id/outline` | 아웃라인 편집 저장(순서/제목/삭제) | P1 |
| POST | `/decks/:id/gates/outline/approve` | 아웃라인 승인 → 생성 계속 | P1 |
| POST | `/decks/:id/gates/facts/decision` | 팩트 일괄 결정 `{decisions:[{factId, status}]}` | P3 |
| POST | `/decks/:id/gates/slide-plan/decision` | 슬라이드 계획 승인/수정요청 `{slideId, action, feedback?}` | P4 |

## Slides (페이지 단위)

| Method | Path | 설명 | Phase |
|---|---|---|---|
| PATCH | `/decks/:id/slides/:slideId` | 수동 편집 저장(요소 patch) | P5 |
| POST | `/decks/:id/slides/:slideId/regenerate` | 해당 페이지만 AI 재생성 `{instruction?, layoutType?}` | P4 |
| POST | `/decks/:id/slides/:slideId/chat` | Copilot 페이지 문맥 수정 명령 | P4 |
| POST | `/decks/:id/slides` | 문맥 맞춤 단일 슬라이드 삽입 `{afterSlideId, instruction}` | P4 |
| DELETE | `/decks/:id/slides/:slideId` | 삭제 | P2 |

## Jobs / Streaming (실시간)

| Method | Path | 설명 | Phase |
|---|---|---|---|
| GET | `/jobs/:id/events` | **SSE 스트림** — `generationEventSchema` 이벤트. 재접속 시 처음부터 재생 | P2 |
| GET | `/jobs/:id` | 잡 상태 폴링 폴백 | P2 |
| POST | `/jobs/:id/cancel` | 생성 조기 중단 | P2 |

## Research (리서치)

| Method | Path | 설명 | Phase |
|---|---|---|---|
| POST | `/decks/:id/sources` | 유저 소스 추가(URL/텍스트/파일 ref) | P3 |
| GET | `/decks/:id/sources` | 소스+팩트 목록(소스 매니저) | P3 |
| POST | `/decks/:id/factcheck` | 원클릭 팩트체크(근거 강/약) | P3 |

## Templates / Themes

| Method | Path | 설명 | Phase |
|---|---|---|---|
| GET | `/templates` | 갤러리(카테고리/비율 필터) | P1 |
| GET | `/themes` | 테마 목록 | P1 |
| POST | `/templates/import-pptx` | PPTX 업로드→테마/레이아웃 추출 | P6 |
| POST | `/brand-kits` | 브랜드킷 저장 | P6 |

## Exports

| Method | Path | 설명 | Phase |
|---|---|---|---|
| POST | `/decks/:id/export` | `{format: 'pptx'|'pdf'|'png'}` → `{jobId}` (완료 시 `export_ready`) | P1 |
| GET | `/exports/:id/download` | 산출물 다운로드 | P1 |

## Settings (동적 설정)

| Method | Path | 설명 | Phase |
|---|---|---|---|
| GET/PUT | `/settings` | 타입드 설정 카탈로그 조회/배치 수정 | P2 |
| GET/PUT | `/prompts` | 프롬프트 카탈로그 + override | P2 |
| GET/PUT | `/model-assignments` | 작업별 LLM 라우팅 | P2 |

## 에러 코드 규약

`NOT_FOUND` · `VALIDATION_FAILED`(zod 상세 포함) · `GATE_REQUIRED`(승인 대기 중 조작 시) · `JOB_CONFLICT`(동일 덱 중복 생성) · `PROVIDER_ERROR`(LLM/검색 상류 실패) · `EXPORT_FAILED` · `INTERNAL`
