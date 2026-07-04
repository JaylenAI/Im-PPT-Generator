# Devlog — P2~P10 전 phase 커버 + 포괄 E2E (2026-07-04)

> dev=origin/dev, 로컬 merge commit 워크플로(PR 아님, 사용자 지시), 브랜치 먼저.

## AI 이미지 — claude -p SVG (P8, 무키)
사용자 지적("AI 이미지도 claude -p로 잘 해왔다"): 외부 이미지 API 키 대신 claude -p로
SVG 벡터 그래픽 생성.
- `generateImage`(image_svg 프롬프트 → SVG 마크업 추출 → base64 data URI, 테마 팔레트 주입).
- 렌더러 `<img src>`·exporter addImage(data URI → PowerPoint용 PNG 래스터) 모두 소비.
- POST /images/generate + 에디터 "이미지" 버튼(AI 개념 입력 또는 URL 폴백).
- 실 E2E: SVG 생성(viewBox 유효 1247자) → 덱 image 요소 삽입 → PPTX ppt/media 임베드.

## 포괄 end-to-end (실 claude 전 기능 관통)
한 흐름에 전 기능을 엮어 검증 — **17/17 통과, 통합 버그 0**:
1. HITL 게이트+리서치: outline 게이트(팩트) → plan 게이트 → 승인 생성 → 출처 슬라이드/인용
2. AI 편집: 번역 · 리라이트 · 스피커 노트(메타 없음) · 예상 질문 · 접근성(100) · 디자인 변형
3. AI 이미지(SVG) · Export(PPTX 5장 유효)
4. CSV→차트 · 화면비 9:16(오버플로 없음) · 덱 복제 · 갤러리 6종

## 전 계층 검증
- 단위+실 PG **233** · 타입체크 **17/17**
- Playwright 브라우저 **10/10**(게이트·인라인편집·속성·발표·드래그·요소추가·공유·가이드·인제스트)
- MCP 서버 PASS(tools/list + generate_deck 실 claude)

## QA로 잡은 실버그(누적 8종)
slide/note 메타 누출(×2, 프롬프트+후처리 가드) · DDL 동시부팅 레이스(advisory lock) ·
PG 테스트 격리 · 에디터 useWidth 콜백 ref · vitest/Playwright 분리 · 썸네일 locator ·
드래그 pointer capture(window 리스너).

## 남은 것(외부 의존/헤비)
Pexels 스톡 사진(키) · 워터폴/Mekko 차트 · PNG export(헤드리스 렌더) ·
오버플로 자동수정(폰트 메트릭) · Excel 파싱 · 15종+ 템플릿/커스텀 저장(테마 영속).
