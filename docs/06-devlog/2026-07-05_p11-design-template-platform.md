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
