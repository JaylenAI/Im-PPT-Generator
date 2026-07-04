# ADR-001: 슬라이드 JSON 스키마를 단일 진실(SSOT)로, 듀얼 렌더러 구조 채택

- 상태: ✅ 확정 (2026-07-03)

## Context

슬라이드 표현 방식 3택: (a) HTML 자유 렌더 → 사후 PPTX 변환(Gamma/Genspark/Manus) (b) 직접 PPTX 생성 (c) JSON 스키마 → 웹 렌더러 + PPTX 익스포터(Beautiful.ai/Canva/Presenton).
요구사항은 "수동 편집 + 페이지 단위 AI 수정 + 편집 가능한 PPTX export"의 동시 성립.

## Decision

**(c) 채택.** `packages/schema`(zod)의 `deckSchema`를 단일 진실로 두고, ① React DOM 절대좌표 렌더러(표시/편집 공용) ② PptxGenJS 익스포터 ③ LLM 출력 계약이 모두 이 스키마를 공유한다. 요소 타입은 PptxGenJS가 네이티브로 표현 가능한 7종(text/list/image/shape/chart/table/icon)으로 **의도적으로 제한**한다.

## Consequences

- (+) export 충실도가 구조적으로 보장 — Tome(PPTX 왕복 부재로 사망), Gamma(export 깨짐 악명)의 실패 회피
- (+) 슬라이드=구조화 데이터 → 페이지 단위 수정·부분 스트리밍·버전 비교가 자연스러움
- (−) HTML 자유 렌더 대비 비주얼 자유도 제약 → 레이아웃 변형 커버리지 확대(P6~)로 상쇄
- (−) 새 요소 타입 추가 시 렌더러+익스포터+스키마 3곳 동시 구현 의무 — 이것이 곧 충실도 보증 장치
