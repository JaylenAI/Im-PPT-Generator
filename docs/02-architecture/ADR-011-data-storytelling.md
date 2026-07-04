# ADR-011: 데이터 스토리텔링 (Chart Highlight + Insight + 레이아웃 리듬)

- 상태: 채택(Accepted)
- 날짜: 2026-07-04
- 관련: [ADR-009 Action Titles](./ADR-009-action-titles.md), [ADR-010 발표 유형](./ADR-010-presentation-types.md)

## 맥락

차트는 "데이터를 보여주는 것"이 아니라 "데이터로 주장하는 것"이어야 한다(McKinsey/Duarte).
기존 차트는 모든 막대를 같은 색으로 그리고 해석을 붙이지 않아, 청중이 스스로
"그래서 뭐?"를 찾아야 했다. 또한 outline이 같은 레이아웃을 연달아 배치하면 시각적으로
단조로워진다.

## 결정

세 가지 레버로 데이터 스토리텔링을 강화한다.

### 1. 핵심 수치 강조 — `highlightIndex`

`chartElement.options.highlightIndex`(labels 기준 인덱스)를 추가.
- **렌더러**(ChartView): 강조 포인트는 accent 색 + 강조(막대/점), 나머지는 opacity 0.35로
  흐리게 → 눈이 핵심 값으로 즉시 향한다. bar/line/area/scatter/pie 모두 적용.
- **익스포터**(PptxGenJS): 단일 시리즈 차트는 `chartColors`를 데이터 포인트별로 매핑해
  강조 인덱스만 accent, 나머지는 흐린 색.
- **레이아웃**(chart.ts): contentSchema에 `highlightIndex` 추가 → 슬라이드 생성기가
  가장 중요한 데이터 포인트를 지정.

### 2. 인사이트 주석 — 'so what'

차트 레이아웃의 기존 `insight` 필드(사이드 카드)를 활용하되, 슬라이드 프롬프트에서
차트 생성 시 insight를 **반드시** 채우도록 강화("그래서 무엇을 말하는가" 한 문장).
insight는 텍스트 요소로 렌더/익스포트되므로 별도 배선 불필요(중복 방지 — ChartElement에
insight를 중복 저장하지 않음).

### 3. 레이아웃 리듬

outline 프롬프트에서 같은 layoutHint 연속 2회 금지(3회 절대 금지) + 글머리·통계·2단·
인용·차트를 번갈아 배치하도록 명시. 수치 섹션은 stat/chart 우선.

## 근거

- **P0 Action Title + P1 데이터 스토리텔링 결합** = "제목이 주장하고(assertion), 차트가
  핵심 수치로 증명하고(highlight), 인사이트가 해석을 못 박는(insight)" 슬라이드.
- `highlightIndex`는 차트 고유 속성이라 element에, `insight`는 레이아웃 표현이라
  레이아웃에 — 각자 책임 위치에 두어 중복 제거.

## 검증

- 렌더러 단위 2(강조 색·흐림, 레이아웃 highlightIndex 전달), 전체 패키지 회귀 그린
- 실 claude E2E: "전기차 시장 성장 데이터" consulting 덱 → 라인 차트에 highlightIndex=4
  (성장 둔화 시점) + insight="2026년 성장률이 20%대로 꺾이며 둔화 조짐" 자동 생성.
  레이아웃 시퀀스 title→chart→two-col→bullets→process→closing(연속 중복 0)
- PPTX 익스포트→LibreOffice 6페이지 렌더 성공. 차트 슬라이드 육안: Action Title +
  라인 차트 + 인사이트 카드 3요소 정상

## 대안 (기각)

- **ChartElement.insight 추가**: 레이아웃이 이미 insight 카드를 렌더/익스포트하므로 중복.
  차트가 다른 레이아웃에서도 쓰이게 되면 재검토.
- **차트 제목(showTitle)에 insight**: Action Title과 시각적으로 충돌 → 사이드 카드 유지.
- **레이아웃 연속 중복 후처리 재배정**: 콘텐츠-레이아웃 정합이 깨질 위험 → 프롬프트 레버로.
