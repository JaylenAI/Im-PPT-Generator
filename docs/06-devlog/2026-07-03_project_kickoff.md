# 2026-07-03 — 프로젝트 킥오프: 리서치·설계·문서화·P0 스캐폴드

## 한 일

1. **리서치 3종 (병렬 에이전트)**
   - Stitch UIUX export 분석: 4화면+DESIGN.md — 디자인 토큰 정본 채택, 코드는 재작성 판정, 누락 화면 식별
   - 기술 리서치: 렌더링 3방식 비교 → JSON 스키마 SSOT 확정, PPTX 라이브러리/스켈레톤(Presenton·PPTist·PPTAgent)/검색 API 검증
   - 경쟁 분석: 14개 제품 × 10차원 전 기능 매트릭스 — Must-have 11축, 시장 공백 5개 도출(슬라이드별 계획 승인 게이트 등)
2. **아키텍처 확정**: ADR-001~005 (스키마 SSOT / 레이아웃=코드 / HITL 3게이트 / 의미 단위 SSE / 가상 캔버스)
3. **문서 스위트 구축**: docs/00-overview~06-devlog — 기획의도(PROJECT_BRIEF), 요구사항(MoSCoW), 시나리오 4종, 용어집, 데이터 모델, API 명세 v1, 디자인 시스템, 화면 17종 설계, 개발환경/코딩규칙/Git/테스트 가이드, 로드맵 P0~P10, 마일스톤 M1~M5
4. **P0 스캐폴드**: pnpm+turbo 모노레포, `@im-ppt/schema`(zod SSOT — 덱/슬라이드/요소7종/리서치/아웃라인/이벤트13종), `@im-ppt/api`(Hono 스켈레톤)
5. 레포명 정렬: `Im-PPT-Generator`, origin 등록(푸시는 미실행)

## 검증

- 단위 18 그린(schema 14 + api 4), typecheck 클린, lint 통과

## 배운 것 / 함정

- **zod v4 `.default()`는 기본값을 재파싱하지 않음** → 내부 기본값 필요 시 `.prefault({})` (chart options에서 실측 적발, 테스트가 잡음)
- Tome 사망 사례 — PPTX export 충실도가 카테고리의 생존 조건임을 설계 근거로 채택
- 경쟁 리서치 서브에이전트가 최종 보고 없이 조기 종료 → 재개 지시로 회수 (긴 리서치는 중간 산출물 요구 필요)

## 다음

- 사용자 커밋 승인 → main 첫 커밋 → dev 분기 → `feature/p1-vertical-slice` 착수 (M1)
