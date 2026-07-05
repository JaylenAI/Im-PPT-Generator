# Devlog — P11 디자인·템플릿 플랫폼 트랙 (2026-07-05)

> dev=`7d0a6a6`. 사용자 요구: 젠스파크/캔바/미리캔버스식 템플릿 선택 UIUX + "유저가 PPTX 양식을 주면 AI가 그 룩으로 채우는" 워크플로(도담도담 케이스).

## 배경 — 정직한 격차 인정

사용자가 준 레퍼런스(한국관광공사 양식 13장 + AI가 만든 도담도담 결선발표 28장)를 실제로 렌더해 분석. 결과물은 템플릿의 파란 테마+브레드크럼을 계승하고, Action Title·리서치 통계·정교한 표/프로세스 다이어그램을 갖춘 고품질 덱이었다.

정직한 진단: **콘텐츠·구조 엔진은 강했지만(Action Title·발표 유형·Deck Doctor), 디자인 다양성 + "유저 템플릿 흡수"는 거의 미적용**이었다. `from-pptx`는 색상만 추출했고, 생성은 고정 10레이아웃에 갇혀 있었다(ADR-002). 이 트랙으로 그 격차를 좁혔다.

## P11.1 — 템플릿 갤러리 (Canva/Genspark UIUX)

- 추상 아이콘 카드 → **실제 렌더 미리보기 썸네일**. `buildSampleDeck(template)`가 LLM 없이 결정론적 5장 샘플 덱을 만들고, 우리 렌더러로 그대로 그린다.
- 테마 10종 추가(다크/파스텔/프리미엄/볼드 — 6→16 템플릿), 카테고리 필터, **미리보기 모달**(캐러셀 + 썸네일 릴).
- 템플릿 선택 → 생성 위저드에 `?template=` 전달, 미리 선택.

## P11.3 — 디자인 엔진 (리치 레이아웃)

- 레이아웃 6종 추가(10→16): `timeline`·`comparison`·`kpi-grid`·`cards`·`bignum`·`roadmap`.
- layout-as-code라 기존 요소로 조립 → **렌더러/익스포터 무변경**. LLM 카탈로그에 자동 노출.
- 실 claude E2E: "연간 성과 보고" → LLM이 kpi-grid·bignum·comparison 자동 선택. PPTX→LibreOffice 렌더 육안 레퍼런스급(KPI 카드+증감, 비교 좌우 패널).

## P11.2 — 템플릿 흡수 (유저 PPTX)

- `pptx-extract`에 **폰트 추출** 추가(majorFont/minorFont → heading/body). 색+폰트.
- `buildCustomTemplate`: 추출 kit을 중립 base 테마에 병합 → 완전한 인라인 themeTokens. 커스텀 템플릿(source: imported_pptx)으로 settings에 영속.
- catalog 팩토리화: `POST /templates/from-pptx`(생성)·`GET /templates`(빌트인+커스텀 병합)·`/:id/sample`(커스텀=themeOverride)·`DELETE`.
- `applyBranding`: 커스텀 템플릿 선택 시 그 themeOverride가 전역 브랜드킷을 이긴다.
- 웹: 갤러리 "PPTX로 내 템플릿 만들기" 업로드 + "내 템플릿" 배지 + 삭제.
- **⭐실 도담도담 템플릿 업로드 E2E**: 파란 #4285f4·Arial 추출 → 내 템플릿(17종 노출) → 그 템플릿으로 "청년 지역 살아보기" 생성 시 themeOverride 파란색 적용 → PPTX 파란 룩 렌더 육안.

## 버그 봉합

- `SlideThumbnail`이 `themeFor` 셀렉터로 themeOverride 덱에서 매 렌더 새 테마 객체를 만들어 **무한 리렌더**(Maximum update depth). themes 배열 구독 + useMemo로 안정화(Playwright pageerror 0 회귀).

## 검증

전체 회귀 220 그린, Playwright 갤러리(pageerror 0), 실 claude E2E(리치 레이아웃 자동선택·템플릿 흡수), PPTX→LibreOffice 렌더 육안 다수.

## 여전히 남은 것(정직)

- 실사 스톡 사진(API 키), PNG export(헤드리스 렌더)
- **완전 자유배치 디자인 엔진**(ADR-002 완전 완화 — 현재는 리치 레이아웃 확장으로 절충)
- **placeholder 정확 채움**(python-pptx식 — 유저 PPTX의 실제 레이아웃 슬롯에 주입; 현재는 색+폰트 identity 흡수까지)

---

## P11.4 — 템플릿 대량 반입 (16 → 113종)

레퍼런스 디자인을 개인 전용 플랫폼에 그대로 반입(오리지널 "안전 자산" 노선 폐기).

- **스타일팩 16종**(`themes/packs.ts`): 색+타이포 페어링 오리지널 팩.
- **design-diversity 60종**(`themes/design-diversity.ts`, MIT): `epoko77-ai/design-diversity`의 ppt-* 팩 `tokens.json`을 우리 `Theme`으로 매핑. 컨설팅/IR·한국 공공기업·키노트·에디토리얼 등.
- **커뮤니티 21종**(`themes/design-community.ts`, MIT): reveal.js 14(공식 테마 SCSS 파싱) + Catppuccin 4(공식 팔레트) + Marp core 3.
- 웹: 팩 폰트 26종 + Pretendard를 Google Fonts/CDN으로 로딩(정체성 재현). Source Sans Pro→Source Sans 3 리네임 매핑.
- 전부 색은 hex 검증(그라디언트/rgba/none 정제), 카테고리 자동 분류.

## P11.5 — 디자인 시스템 엔진 (10종)

"색만 다르고 골격은 동일" 문제 해결. 색/폰트를 넘어 레이아웃 골격을 시스템 단위로 차별화.

- `schema/theme.ts`: `themeStyleSchema`(system·headingCase·titleAccent·kicker·background·surface·radius·border) optional 추가(하위호환).
- `themes/design-systems.ts`: 10종(dark-tech-glow/consulting-grid/editorial-serif/brutalist-block/pastel-card/luxury-keynote/swiss-minimal/glass-gradient/data-infographic/warm-organic) + 키워드 분류기 + `withDesignSystem`.
- `layouts/decorate.ts`: `applyDesignSystem` — 대문자 헤딩·타이틀 액센트(bar/sidebar/underline/block)·배경(grid/ruled/gradient/watermark)·표면 radius/헤어라인을 build 결과에 후처리. `defineLayout`이 16개 레이아웃 전부에 일괄 적용.
- build 호출부(sample-deck·core pipeline slide/edit/deck·csv-chart)에 테마 style 전달.
- 113종을 10 시스템에 매핑(swiss 27·dark-tech 16·consulting 15·editorial 12·warm 9·data 8·pastel/luxury 7·glass/brutalist 6).

## 검증

전체 타입체크 17/17 그린, 테스트 회귀 없음(core 66·api 33·exporter 9), Playwright로 갤러리 113종 + 미리보기 모달(Charcoal Gold·Crimson Bold) 육안 — 시스템별 골격 차이 확인, 렌더 무파손.

## 한계(정직)

- 아직 **패밀리 단위(10종)** 차별화지 팩별 픽셀 재현은 아님. 타이틀 슬라이드는 색+폰트+대문자로 주로 읽히고 구조 장식(grid/카드/보더)은 콘텐츠 슬라이드에서 드러남.
- 배경 grid/ruled opacity가 은은해 썸네일에선 약함 — 강도 튜닝 여지.
- 캔바/미리캔버스 등 이미지 기반 템플릿은 PPTX 흡수(P11.2) 경로로만 반입 가능.
