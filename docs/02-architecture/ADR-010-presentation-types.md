# ADR-010: 발표 유형 시스템 (Presentation Type Recipes)

- 상태: 채택(Accepted)
- 날짜: 2026-07-04
- 관련: [ADR-007 API-First 헤드리스](./ADR-007-api-first-headless.md), [ADR-009 Action Titles](./ADR-009-action-titles.md)

## 맥락

기존 outline 생성기는 모든 주제에 **동일한 표준 구조**(도입-본론-결론)를 적용했다.
그러나 실제 발표는 장르마다 검증된 서사 골격이 다르다:

- **PT 면접** → STAR(상황-과제-행동-결과)로 역량 증명
- **컨설팅 제안** → SCQA + Minto 피라미드로 문제→해법 논증
- **IR 피치** → 문제-솔루션-시장-트랙션(Guy Kawasaki)
- **학술 발표** → IMRaD(서론-방법-결과-논의)
- **세일즈** → PAS(문제-증폭-해결)

이 골격을 모르면 "슬라이드 나열"은 되지만 "그 장르에서 통하는 발표"는 안 된다.
한국 시장에서 특히 수요가 큰 PT면접·IR·컨설팅을 첫 타깃으로, 발표 유형을
**데이터(레시피)** 로 표현해 생성기가 그 서사 구조를 따르게 한다.

## 결정

발표 유형을 코드 분기가 아니라 **카탈로그 데이터**로 정의한다(하드코딩 금지 원칙).

### 1. 스키마 — `packages/schema/src/presentation-type.ts` (SSOT)

```ts
PresentationType = {
  id, label, description, useCases,
  narrative,        // 서사 프레임워크 이름
  structure: Beat[],// 순서 있는 논리 비트(role + hint + slides)
  slideRange, defaultSlides,
  tone, designHints,
}
```

`PRESENTATION_TYPES` = 핵심 6종 배열(general·interview·consulting·ir_pitch·academic·sales).
**유형 추가 = 배열에 항목 1개 추가**. 파이프라인/UI/API 코드는 불변.

### 2. 생성 config — `generation-config.ts`

`presentationType: presentationTypeIdSchema.default('general')` 필드 추가.
`buildConfig`/`resolveGenerationConfig`가 제네릭하게 흘려보내므로 API 배선 불필요.

### 3. outline 주입 — `core/pipeline/outline.ts`

`renderScaffold(type)`가 서사·골격·톤·디자인을 프롬프트 텍스트로 렌더 →
`outline_system` 프롬프트의 `{scaffold}` 변수로 주입. general이면 표준 골격,
특정 유형이면 그 장르 구조. 생성기는 골격의 **논리 순서**를 따르되 요청 슬라이드 수에
맞춰 비트별 장수를 조정한다(경직된 템플릿이 아니라 가이드).

### 4. API — `GET /presentation-types`

읽기 전용 카탈로그(themes/templates와 동일 패턴). 웹이 소비.

### 5. 웹 — `PresentationTypePicker.tsx`

생성 폼에서 "무슨 발표인가"를 먼저 선택. 선택 시 그 유형의 `defaultSlides`를 제안.

## 근거

- **품질**: 유형별 서사 골격 → 장르 관습에 맞는 설득력 있는 구조. ADR-009 Action Title과
  결합하면 "제목만 읽어도 그 장르의 스토리가 되는" 덱.
- **확장성**: 데이터 주도 → 유형 추가가 배열 편집. 향후 유형별 기본 테마/레이아웃 힌트도
  같은 레시피에 얹을 수 있다.
- **한국 시장 적합**: PT면접·IR·컨설팅 등 실수요 장르를 1급 시민으로.

## 검증

- 스키마 단위 4(카탈로그 무결성·폴백·스캐폴드·config 흐름), 전체 스키마 42 그린
- 실 claude E2E: `interview` → STAR 구조(위기→행동→수치 결과), `ir_pitch` → Kawasaki
  구조(문제→솔루션→6조 시장→트랙션→해자→투자요청). 유형별 구조가 확연히 차별화됨
- Playwright: 선택기가 서사·권장 슬라이드 수 반영

## 대안 (기각)

- **프롬프트에 유형별 if 분기**: 코드 비대·유형 추가마다 코드 수정 → 데이터 카탈로그로 대체
- **유형별 별도 프롬프트 템플릿**: 중복 다수·유지보수 부담 → 단일 프롬프트 + 스캐폴드 주입

## 확장 (P0.6, 2026-07-04) — 유형별 디자인 자동 매칭

발표 유형이 서사 구조뿐 아니라 **시각 정체성**도 갖도록 각 유형에 `defaultThemeId`를 추가.
6종을 6개 빌트인 테마에 1:1 매칭(general=stitch-indigo, interview=deep-navy,
consulting=mono-slate, ir_pitch=coral-energy, academic=forest-green, sales=royal-purple).

- **테마 우선순위**(`deck.ts::resolveTemplate`): 명시 themeId > (사용자가 템플릿 선택 시 그
  테마) > 발표 유형 기본 테마 > 템플릿 기본. **사용자의 명시 선택은 언제나 우선** — 유형
  기본은 "아무것도 안 골랐을 때"의 빈칸만 채운다.
- `hasTheme(id)`로 안전 검사(미등록 테마면 템플릿 기본으로 폴백).
- 웹 선택기: 각 유형 카드에 기본 테마 accent 색 점 표시(장르 시각 미리보기).
- 검증: 유형↔테마 교차검증 단위 2(core), 실 claude E2E — interview→deep-navy,
  ir_pitch→coral-energy, consulting→mono-slate 자동 적용 + themeId 명시 시 override 확인.
