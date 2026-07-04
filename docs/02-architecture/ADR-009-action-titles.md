# ADR-009: Action Title (Assertion-Evidence) 슬라이드 제목

- 상태: 채택 (2026-07-04)
- 관련: ADR-001(스키마 SSOT), ADR-003(HITL 게이트)

## 배경

딥리서치(McKinsey/Minto Pyramid Principle, Michael Alley Assertion-Evidence,
academic-pptx-skill, ppt-master 등) 결과, 상위 프레젠테이션 도구·스킬이 공유하는
가장 임팩트 큰 원칙은 **Action Title**이다:

- 슬라이드 제목은 **주제 라벨이 아니라 완결된 결론 문장(assertion)**.
  ❌ "시장 현황" → ✅ "국내 시장은 3년째 연 34% 성장 중이다".
- 본문(차트·표·불릿)은 그 문장을 **증명**하는 근거.
- **Ghost Deck / Titles Test**: 제목만 순서대로 읽어서 전체 논리가 통해야 한다.

기존 우리 outline은 주제 라벨(`"기회"`, `"전략"`)을 생성해 이 원칙을 어겼다.

## 결정

1. `outlineSectionSchema`에 `assertion` 필드 추가 — `title`(짧은 라벨: 썸네일/
   네비)과 `assertion`(슬라이드 헤드라인: 완결 문장)을 **분리**한다.
2. `GenerationConfig.titleMode`(`assertion`|`topic`, 기본 `assertion`)로 제어.
3. 슬라이드 헤드라인 = `titleMode==='assertion' && assertion` 있으면 assertion,
   없으면 `title`로 **폴백**(하위호환: assertion 없는 덱/테스트 무손상).
4. `checkGhostDeck(outline)` 순수 함수 — 제목 배열 + 구조적 논리 점검(모든 섹션
   assertion 존재·문장형). API/UI가 "제목 논리 점검" 뷰로 소비.

## 근거

- **저비용·고효과**: 프롬프트 개정 + 스키마 1필드로 컨설팅급 논리 획득.
- **전 도메인 적용**: PT면접·컨설팅·IR·학술 전부 이 원칙을 공유.
- **하위호환**: 폴백으로 기존 동작 보존, 신규 필드 전부 optional/default.

## 결과

- outline/slide 프롬프트가 assertion 생성·소비. OutlineGate가 assertion 편집.
- 에디터에 Ghost Deck 뷰(제목만 순서 표시)로 "titles test" UX 제공.
