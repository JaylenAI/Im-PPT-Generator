# DEVELOPMENT PLAN — 마일스톤/진행 방식

> Phase 상세는 [ROADMAP.md](ROADMAP.md). 이 문서는 마일스톤 묶음과 진행 규칙을 정의한다.

## 마일스톤

### M1: "관통" — 프롬프트에서 PPTX까지 (P0~P1)
- 산출: 프롬프트 → 아웃라인 승인 → 템플릿 2종/레이아웃 8종 생성 → 웹 렌더 → **PowerPoint에서 편집되는 PPTX**
- 데모: 실 API로 15장 덱 1개를 만들어 PowerPoint에서 열기
- 태그 후보: v0.1.0

### M2: "살아있는 생성" — 영속화+실시간 (P2)
- 산출: Supabase+잡큐, SSE 실시간 생성 뷰(slide_delta), 재접속 재생, 동적 설정
- 데모: 생성 중 새로고침해도 진행 화면 복원

### M3: "신뢰" — 리서치+HITL 완성 (P3~P4)
- 산출: 딥서치+팩트 승인+인용 역추적, 슬라이드별 계획 승인, 자율도 L0~L3, Copilot 페이지 수정
- 데모: 시나리오 1(임원 보고 덱) 풀 여정 — **핵심 차별화 완성**
- 태그 후보: v0.5.0

### M4: "손맛" — 에디터+템플릿 (P5~P6)
- 산출: WYSIWYG 편집, 버전 히스토리, 템플릿 15종+, 브랜드킷, PPTX 업로드 추출

### M5: "패리티" — 입력/이미지/발표/부가 (P7~P10)
- 산출: 경쟁 Must-have 11축 전체 + API/MCP
- 태그 후보: v1.0.0

## 진행 규칙 (모든 Phase 공통)

1. **문서 먼저**: phase 착수 전 관련 설계 문서 갱신(이 저장소의 docs가 정본)
2. **수직 슬라이스**: 스키마→core→API→UI를 기능 단위로 관통, 매 phase 동작 데모 산출
3. **TDD + 실데이터 E2E**: [TESTING_STRATEGY](../05-guides/TESTING_STRATEGY.md) — 목 금지
4. **브랜치**: phase당 1 feature 브랜치 → 검증 그린 → 사용자 확인 → dev squash 머지 ([GIT_WORKFLOW](../05-guides/GIT_WORKFLOW.md))
5. **문서 실시간 갱신**: 커밋마다 CURRENT_STATUS/ROADMAP 상태(❌/🔄/✅) 동기화, phase 완료 시 devlog 1건 작성
6. **회고**: 마일스톤 종료마다 devlog에 4L(Liked/Learned/Lacked/Longed for) 기록

## 위험 관리

| 위험 | 대응 |
|---|---|
| PPTX 충실도 이슈 발견 지연 | M1부터 LibreOffice 육안 QA를 커밋 게이트에 포함 |
| LLM 스키마 준수율 저하 | 골든 프롬프트 회귀 세트로 phase마다 계측 |
| 이미지 단가 폭증 | P8에서 스톡 폴백 우선, 생성은 옵트인 |
| 야생 PPTX 파싱 난이도 | P6 스코프를 placeholder 기반으로 제한, 확장은 PPTAgent 방식 검토 |
| 스코프 크리프 | Won't Have(SaaS/CRDT/모바일앱) 변경은 사용자 승인 필수 |
