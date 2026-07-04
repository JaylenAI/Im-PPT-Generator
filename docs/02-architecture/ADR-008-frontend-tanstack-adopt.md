# ADR-008: 웹 프론트엔드 = flow-deck-creator 채택 (Next.js → TanStack Start)

- 상태: ✅ 확정 (2026-07-04)
- 개정: TECH_STACK의 "웹: Next.js" 선택을 대체. ADR-007(API-First)은 그대로 유효 — 프레임워크만 변경.

## Context

`apps/web`은 아직 미작성 상태였다. 초기 TECH_STACK은 Next.js를 상정했으나, 사용자가 **flow-deck-creator**(github.com/JaylenAI/flow-deck-creator, 본인 소유)를 제공했다. 이 앱은:

- TanStack Start(React 19) + Vite + Tailwind v4(oklch 토큰) + shadcn/ui 50개 + zustand + pptxgenjs + recharts + zod
- **우리가 P1/P4에서 만들려던 화면이 이미 작동**: 생성 위저드(prompt→outline→building 라이브), 3분할 에디터(툴바+캔버스+썸네일 릴+AI Copilot 챗/딥서치 탭), 템플릿 갤러리, 브랜드킷, 대시보드
- 단 **프론트엔드 전용 목업**: 백엔드·실 AI 없음. `generation.ts`는 하드코딩 canned 콘텐츠, `setTimeout`으로 AI 흉내, export는 제목+텍스트 나열(저충실도)

## Decision

**flow-deck-creator를 `apps/web`의 뼈대로 채택한다. 프론트 프레임워크는 Next.js → TanStack Start로 변경.** 근거: ADR-007에 따라 웹은 백엔드 API의 단순 클라이언트일 뿐이라 프레임워크 선택 리스크가 구조적으로 낮다. 이미 우리 목표 화면이 작동하는 앱을 Next로 재작성하는 것은 순수 낭비.

### "껍데기는 차용, 슬라이드 계층은 우리 것으로 교체"

| 그대로 차용(앱 셸) | 우리 것으로 교체(슬라이드 두뇌) |
|---|---|
| 대시보드·위저드·에디터 셸·썸네일 릴·Copilot 패널·템플릿/브랜드킷 페이지 | `Slide` 타입 → `@im-ppt/schema` `deckSchema`(절대좌표) |
| shadcn 컴포넌트 + oklch 토큰 + 화면 흐름/라우팅 | `SlideView`(의미 렌더) → `@im-ppt/renderer`(좌표 렌더) |
| | 가짜 `generation.ts` → `POST /decks` + SSE 소비 |
| | 저충실도 `export-pptx.ts` → `@im-ppt/exporter` |
| | `store`(localStorage) → API 호출(+로컬 캐시) |

핵심: 이 앱의 **의미(semantic) 슬라이드 모델**(bullets/stats/columns를 Tailwind로 렌더)은 웹엔 편하지만 PPTX 충실도가 조악하다(이 앱의 export가 그 증거). 우리는 **절대좌표 모델**(ADR-001/005)을 유지하므로, 앱의 슬라이드 캔버스(`SlideView`)만 우리 렌더러로 교체한다. 나머지 앱 셸은 슬라이드 모델과 무관해 그대로 쓴다.

### 편입 시 정리 작업

- Lovable 벤더 커플링 제거: `@lovable.dev/vite-tanstack-config`, `lovable-error-reporting.ts`, `.lovable/`, AGENTS.md의 Lovable 블록
- 모노레포 편입: `apps/web`로 이동, `@im-ppt/schema` 등 워크스페이스 의존 연결
- zod v3(앱) → v4(우리) 정렬

## Consequences

- (+) P1/P4 프론트 수 주 단축 — 작동하는 UI를 백엔드 완성 후 얹기만 하면 됨
- (+) ADR-007 API-First 불변 — 가짜 로직을 실 API 호출로 교체하는 것이 전부
- (+) 헤드리스라 향후 프레임워크 재전환도 저비용(이 결정 자체가 그 증거)
- (−) TanStack Start는 Next보다 생태계 작고 새것 → 업그레이드 시 breaking 주의. 단 용도가 단순 API 클라이언트라 노출면 작음
- (−) 앱의 슬라이드 모델/렌더러/스토어/익스포트 4개를 걷어내고 우리 것으로 배선하는 편입 작업 필요(P1 백엔드 완성 후 착수)
