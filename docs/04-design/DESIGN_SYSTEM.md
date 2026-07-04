# DESIGN SYSTEM — 디자인 시스템

> 정본 출처: Stitch export `intelligent_canvas/DESIGN.md` (`~/Downloads/stitch_interactive_ai_slide_studio 2`). 이 문서가 웹앱 Tailwind 토큰의 설계 정본이며, P1에서 `apps/web` Tailwind config로 이식한다.
> ⚠️ 이것은 **제품 웹앱의 디자인 시스템**이다. 슬라이드 자체의 테마 토큰(`packages/schema` themeSchema)과 구분할 것.

## 핵심 철학

- 감성 목표: **"blank canvas anxiety → curated confidence"**
- **이원 액센트 전략**: 사람의 액션과 AI의 액션을 색으로 구분한다 — 유저가 "지금 AI가 하는 일"을 항상 시각적으로 인지

## 컬러 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| `primary` (Professional Indigo) | `#4F46E5` (진한 변형 `#3525cd`) | **사람 주도** 액션: 내비, 기본 버튼, 선택 상태 |
| `ai-accent` (AI Cyan) | `#06B6D4` (밝은 변형 `#57dffe`) | **AI 순간** 전용: 생성 버튼, 진행바, 매직 제안, shimmer |
| `canvas-bg` | `#F8FAFC` | 라이트 기본 배경(소프트 슬레이트) |
| `sidebar` | `#0F172A` | 사이드바 딥 네이비 |
| `success / warning / error` | `#10B981` / `#F59E0B` / `#ba1a1a` | 상태 |

다크모드: 토큰 레벨에서 대응(`CSS 변수 + dark 오버라이드` — Im-Shorts-Creator에서 검증한 방식: 인라인 스타일은 반드시 `var()` 사용). Stitch export는 다크 토큰만 정의하고 미구현 — 우리는 P1에서 라이트 우선, 다크는 변수 구조만 깔고 후속.

## 타이포그래피

| 폰트 | 용도 |
|---|---|
| **Geist** | 헤딩/UI (기하학적) |
| **Inter** | 본문 |
| **JetBrains Mono** | 메타/라벨/신뢰도 수치 ("computed" 느낌 — 출처 칩, 팩트 통계) |
| Material Symbols Outlined | 아이콘 |

스케일: display-lg 48px → mono-label 12px (Stitch DESIGN.md 스케일 준용).

## 컴포넌트 규칙

- **글래스 패널**(AI 영역 전용): 70% 불투명 화이트 + `backdrop-blur(12px)` — AI 기능을 일반 편집 도구와 시각 분리
- **ai-shimmer / ai-progress-bar**: 인디고→시안 그라디언트 애니메이션 — 진행 중 상태
- **ambient-glow**: 무거운 드롭섀도 금지, `0 4px 20px rgba(0,0,0,.05)` 단일 글로우
- **active-slide-ring**: 선택 슬라이드 인디고 링
- 라운딩: 기본 `0.5rem`, AI 칩은 pill. 스페이싱 4px 베이스
- 출처 칩(citation chip): mono 폰트 + 소스 링크 — 클릭 시 소스 매니저로

## 레이아웃 패턴 (Stitch 4화면에서 추출)

- **3분할 에디터**: 좌 사이드바 280px + 중앙 캔버스(fluid) + 우측 패널 320px(AI Copilot ↔ 속성 패널 탭 전환)
- **썸네일 릴**: 캔버스 하단 슬라이드 스트립 + "Add Slide" 점선 버튼
- **벤토 그리드**: 리서치/팩트 승인 화면(좌 5 / 우 7 컬럼)
- **타임라인형 팩트 로그**: STATISTIC/KEY INSIGHT/VISUAL ASSET 카드 + 승인/거절 버튼

## 웹앱 공통 프리미티브 (P1에서 구현)

Card / CardHeader / EmptyState / Spinner / Alert / StatusBadge / Toast(글로벌 Provider) — Im-Shorts-Creator ui.tsx 패턴 재사용. 모든 async 액션에 토스트+로딩, 빈 상태는 EmptyState, a11y aria-label 필수.
