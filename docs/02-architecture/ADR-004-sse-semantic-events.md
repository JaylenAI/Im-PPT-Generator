# ADR-004: 의미 단위 SSE 이벤트 스트리밍 (토큰 스트림 금지)

- 상태: ✅ 확정 (2026-07-03)

## Context

"AI가 PPT를 실시간으로 만드는 모습"이 핵심 UX. 토큰 단위 스트림은 프론트가 파싱 책임을 지고 계약이 불안정하다. 생성은 수 분 단위 — 유저 이탈/재접속이 정상 경로다.

## Decision

SSE(단방향)로 **의미 단위 이벤트**만 흘린다. 계약은 `packages/schema/src/events.ts`의 `generationEventSchema`(discriminated union 13종)가 정본. 슬라이드가 그려지는 모습은 `slide_delta`(부분 슬라이드 JSON 패치)로 표현한다. 모든 이벤트는 잡 레코드에 영속되어 **재접속 시 처음부터 재생**된다.

## Consequences

- (+) 프론트는 스키마 파싱만 — 렌더러가 부분 덱을 그대로 그림
- (+) 활동 로그(Manus 스타일)가 이벤트 재생으로 공짜로 나옴
- (−) 이벤트 로그 저장 비용 → 완료 잡은 요약 압축(P2에서 정책)
- (−) `slide_delta.patch`는 `z.unknown()` — 수신 측이 방어적으로 병합해야 함
