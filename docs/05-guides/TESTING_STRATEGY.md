# TESTING STRATEGY — 테스트 전략

## 원칙

1. **Phase마다 실데이터 E2E + QA 필수 — 목(mock) 금지.** 실 LLM/검색 API로 검증하고 커밋한다.
2. TDD: 테스트 먼저(RED) → 구현(GREEN) → 리팩토링. 커버리지 80%+.
3. **가짜 그린 금지** — 항상 통과하는 테스트(단언 없는 렌더 등)는 삭제 대상.
4. 테스트 실패 시 구현을 고친다(테스트가 틀린 경우만 예외).

## 피라미드

| 층 | 도구 | 대상 | 예 |
|---|---|---|---|
| 단위 | vitest | 스키마 검증, 순수 함수(좌표 변환, 토큰 resolver, 오버플로 계산) | `deckSchema` 거부 케이스, px→inch |
| 통합 | vitest | API 라우트(app.request), DB 쿼리, LLM/검색 실호출 파이프라인 | 아웃라인 생성 → 스키마 통과 |
| E2E | Playwright | 유저 여정: 생성 위저드→게이트→생성→편집→export | 시나리오 1~4 ([USER_SCENARIOS](../00-overview/USER_SCENARIOS.md)) |

## 영역별 특수 전략

### PPTX Export 충실도 (가장 중요한 QA)
- **스냅샷 테스트**: 고정 덱 fixture → PptxGenJS 산출 XML 구조 스냅샷 비교
- **육안 QA**: LibreOffice headless로 PPTX→PNG 렌더 → 웹 렌더 스크린샷과 나란히 비교(anthropics/skills 방식). phase 커밋 전 체크리스트
- **왕복 검증**(P6+): export한 PPTX를 파서로 다시 읽어 요소 수/텍스트 일치 확인
- 수동: 실제 PowerPoint/Keynote에서 열어 전 요소 편집 가능 확인

### LLM 파이프라인
- 스키마 준수율 계측: 동일 프롬프트 N회 실행 → safeParse 성공률 기록(리그레션 감지)
- 골든 프롬프트 세트: 대표 주제 5종(비즈니스/교육/기술/창의/한국어 장문)으로 phase마다 회귀
- 비용 계측: 테스트 실행당 토큰/원가 로그

### SSE/잡
- 재접속 E2E: 생성 중 페이지 새로고침 → 이벤트 재생으로 상태 복원 확인
- 게이트 E2E: 게이트 대기 중 승인/거절/수정요청 각 경로

### 렌더러
- 요소 7종 × 레이아웃 변형 조합 스토리 렌더 + 스크린샷 비교
- 오버플로 스트레스: 긴 제목/긴 불릿/큰 표 fixture 스윕(잘림·겹침 적발)

## 수동 QA 체크리스트 (phase 커밋 전)

- [ ] 해당 phase E2E 시나리오 실 API로 1회 관통
- [ ] PPTX 다운로드 → PowerPoint에서 열림 + 텍스트 편집됨
- [ ] 에러 경로 1개 이상 확인(API 키 제거 등) — 사용자 친화적 메시지
- [ ] 빈 상태/로딩 상태 표시
- [ ] `pnpm test && pnpm typecheck && pnpm lint` 그린
- [ ] docs/CURRENT_STATUS.md + ROADMAP 상태 갱신
