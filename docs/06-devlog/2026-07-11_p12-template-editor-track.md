# Devlog — P12 템플릿·에디터 트랙 (2026-07-11)

> 브랜치 `feature/p12-premium-layouts`에 6단계 순차 커밋(로컬). 각 단계 실데이터 QA + 타입체크 17/17 그린. push/merge는 사용자 승인 대기.

실제 PPT AI 플랫폼(Gamma·Canva·Genspark·Manus 등) 대비 심층 분석에서 도출한 6개 갭을 P12로 마감했다. 핵심 인식: 기존 "113종 템플릿"은 대부분 리컬러였고, 진짜 다양성은 **새 레이아웃 모듈 + 새 디자인 시스템**에서 나온다.

## 1. 프리미엄 레이아웃 7종 (→ 총 22종)

에디토리얼/키노트 구도의 이미지·타입 포워드 레이아웃 추가: `section`(섹션 구분)·`statement`(대형 선언문)·`feature-quote`·`split-feature`(좌우 분할)·`hero-image`(풀블리드)·`feature-grid`·`closing`(마무리). 레지스트리 배열 1줄 추가 원칙 유지(`LAYOUT_LIST`), `references`는 시스템 자동 생성(LLM 카탈로그 제외).

## 2. 에디터 슬라이드 단위 관리

썸네일 레일에서 슬라이드 추가/복제/이동/삭제. 불변 헬퍼(`addSlide`/`duplicateSlide`/`moveSlide`/`deleteSlide`, `reidElements`로 요소 id 재발급). Playwright `slide-management`로 추가→저장→새로고침 영속 검증.

## 3. PDF/PNG export (헤드리스 렌더)

PPTX에 더해 `renderDeckToPdf`·`renderDeckToPngs`(헤드리스 렌더 → PDF/슬라이드별 PNG). png는 슬라이드별 PNG를 zip으로 묶어 반환(`slide-01.png …`). export 포맷 enum `pptx|pdf|png`. 실 export로 PDF 시각 충실도 육안 확인.

## 4. 브랜드 URL 임포트 (색·폰트 추출)

`POST /templates/from-url` — 브랜드 사이트 URL에서 대표 색·폰트를 추출해 브랜드 테마 생성.
- **SSRF 방어**: `assertPublicUrl`(private/loopback/link-local/metadata IP 차단·DNS 해석 검증·리다이렉트 재검증), 크기·타임아웃 캡.
- **색 분류**: CSS 변수(`--primary`/`--brand`/`--accent` 가중 40) + `theme-color` 메타(가중 100, 단 채도·명도 필터 통과 시). near-white/near-black을 브랜드 후보에서 제외 → Vercel primary=#bd5200(초기 버그: theme-color를 무조건 primary로 강제 → #fafafa near-white 봉합).
- **폰트**: Google Fonts 링크 + `font-family`를 HTML+CSS 번들 전체에서 스캔(초기 버그: 인라인 HTML만 스캔 → self-hosted 폰트 누락 → Airbnb Cereal VF 봉합).
- 추출 실패 시 `400 EXTRACT_FAILED`(무성 폴백 금지). 단위 18(url-extract 14 + catalog-from-url 4), SSRF 거부 10 URL 검증.

## 5. 템플릿 시퀀스 + 디자인 시스템 20종

**템플릿 시퀀스**: 템플릿이 슬라이드 흐름(`layoutOrder`)을 소유. `alignLayoutsToSequence`가 텍스트 슬라이드만 서사 순서로 정렬하고, **데이터 레이아웃(chart/stat/kpi-grid/comparison/timeline/process/quote/references)은 양방향 보존**(빈 차트 날조 금지, 데이터 슬라이드 파괴 금지). 첫=title·끝=closing 고정. 실 claude E2E로 business-forest-green이 정확히 비즈니스 흐름 산출 확인.

**디자인 시스템 10 → 20종**: (P12 추가) terminal-mono·poster-bold·cloud-soft·corporate-outline·mono-label·vivid-block·blueprint-tech·gallery-frame·neo-startup·paper-academic. 분류 미매칭 테마를 `swiss-minimal` 단일 폴백 대신 `themeId` 안정 해시로 7개 풀에 분산 → 113종이 한 시스템으로 쏠리던 단조로움 해소. 단위 17(sequence 10 + design-systems 7).

## 6. 스톡 이미지 피커 (Pexels/Unsplash)

편집기 추가 툴바 "스톡" → 슬라이드 제목으로 프리필된 검색어로 실사진 검색 → 클릭 시 원본을 data URI로 받아 이미지 요소 삽입.
- **포트 패턴**: `createPexelsAdapter`/`createUnsplashAdapter`(Pexels 우선, Unsplash 폴백) — 검색 어댑터(Tavily/Serper)와 동일하게 `fetchImpl` 주입으로 실 응답 형태를 키 없이 테스트.
- **키리스 안전**: 키 미배선 시 `GET /images/stock`이 `{available:false}` → 피커가 "키 미설정" 안내(레이아웃 폴백 유지).
- **SSRF 방어**: `POST /images/stock/fetch`는 허용 CDN 호스트(images.pexels.com/images.unsplash.com/plus.unsplash.com) https만, 8MB 캡, content-type 이미지 검증.
- 단위 9 + Playwright `stock-picker`(키리스 경로). 실서버 curl QA: evil.com·169.254.169.254 거부(400), 실 Pexels CDN URL은 data URI 변환 성공(200).

## 검증

- 타입체크 17/17(FULL TURBO), apps/api 단위 60 그린, Playwright sequence·stock-picker·slide-management 신규 그린.
- 커밋(로컬, feature/p12-premium-layouts): `ee715d0`(레이아웃) → `c24443c`(슬라이드 관리) → `e985d05`(export) → `c2ab1c3`(브랜드 URL) → `f13b74d`(시퀀스+디자인 시스템) → `0e6e65e`(스톡 피커) → docs.

## 남은 것 (정직)

- **키 배선 시 활성**: 스톡 실사진(PEXELS_API_KEY/UNSPLASH_ACCESS_KEY)·브랜드 URL 실추출은 키/네트워크 필요(키 없으면 안전 폴백).
- **생성 시 자동 이미지 채움**: imageMode(stock/mixed)는 스키마·설정엔 있으나 생성 파이프라인 미소비 — 레이아웃별 사진 배치는 20개 디자인 시스템 전수 시각 QA가 선행돼야 해 별도 트랙(현재는 편집기 피커로 사용자 주도 삽입만).
- Mekko 차트·Excel 파싱은 여전히 미착수.
