# CURRENT STATUS

> 마지막 업데이트: 2026-07-11 · **P2~P10 + 콘텐츠 품질 트랙 + P12 템플릿·에디터 트랙 + PPT 20선 재현 트랙 완료** — 딥리서치 기반 6레버(Action Title·발표 유형 10종·유형별 디자인 매칭·데이터 스토리텔링·Deck Doctor 진단·AI 자동 수정) + P12 6단계 + **PPT 샘플 20선 1:1 재현·파생 81종**(원본 20 + 팔레트 변형 47 + 분야 필드 14).
>
> **모든 백엔드 기능이 UI로 연결됨** + 워터폴 차트·오버플로 자동수정 완료. **템플릿 194종 / 레이아웃 35종 / 디자인 시스템 20종.** 타입체크 그린, 패키지 회귀 그린(templates 196 등) + 실데이터 생성 검증(클라우드 시장 투자자 브리핑 9슬라이드, fld-investor-review). 남은 것: 스톡 실사진·브랜드 URL 임포트는 **키 배선 시** 실사진/실추출(키 없으면 안전 폴백)·Mekko 차트·Excel 파싱 — 외부 키 또는 별도 인프라 필요 항목만.

## 모듈별 진행률

| 모듈 | 상태 | 비고 |
|---|---|---|
| 모노레포 셋업 (pnpm+turbo+TS strict) | ✅ 완료 | P0 |
| `packages/schema` — 덱/슬라이드/이벤트/GenerationConfig SSOT | ✅ 완료 | P0, 단위 29 |
| `packages/templates` — 테마 2종 + 레이아웃 8종 | ✅ 완료 | P1, 단위 49 |
| `packages/core` — 파이프라인/프롬프트/프로바이더(claude-cli)/편집 | ✅ 완료 | P1+P4, 단위 37 + 통합 |
| `packages/exporter` — PptxGenJS PPTX | ✅ 완료 | P1, 단위 9 + E2E |
| `packages/renderer` — React 슬라이드 렌더러 | ✅ 완료 | P1, 단위 5 |
| `packages/db` — Postgres+Drizzle 덱·잡·설정 영속 | ✅ 완료 | P2, 단위+실PG 통합+재시작 E2E |
| `apps/api` — 덱/Export/카탈로그/설정/스트림/잡/편집 라우트 | ✅ 완료 | P1+P2+P4 |
| `apps/web` — flow-deck-creator UI 편입(TanStack Router SPA) | ✅ 완료 | P1, 실제 화면+우리 백엔드 배선 |
| SSE 실시간 생성 스트리밍 | ✅ 완료 | P2, 실 claude 검증 |
| Postgres 잡큐(detach+재접속 재생+크래시 복구) | ✅ 완료 | P2, 실 claude+재시작 E2E |
| Docker 전체 스택 셀프호스트(`docker compose up`) | ✅ 완료 | P2, 빌드+서빙+프록시 검증 |
| 동적 설정 카탈로그 + DB 영속(핫리로드) | ✅ 완료 | P2, PATCH+재시작 영속 E2E |
| 페이지 단위 AI 수정(에디터 Copilot) | ✅ 완료 | P4, 실 claude E2E |
| `packages/research` — 소스→팩트→인용 파이프라인 | ✅ 완료 | P3a, 실 claude E2E |
| 출처 슬라이드 자동 렌더(references 레이아웃) | ✅ 완료 | P3b |
| 슬라이드별 계획 게이트(백엔드) + 위저드 UI | ✅ 완료 | P4, 실 claude + Playwright |
| WYSIWYG(인라인 편집 + 속성 패널 + undo/redo) | ✅ 완료 | P5a+b, Playwright 영속 E2E |
| 발표 모드(전체화면 + 키보드 네비 + 노트) | ✅ 완료 | P9, Playwright E2E |
| 프로세스 다이어그램 레이아웃 | ✅ 완료 | P8, 실 export E2E |
| **품질: Action Title 엔진 + Ghost Deck** | ✅ 완료 | ADR-009, 실 claude E2E + Playwright |
| **품질: 발표 유형 10종 + 자동 테마 매칭** | ✅ 완료 | ADR-010, 실 claude E2E(유형별 구조) + Playwright |
| **품질: 데이터 스토리텔링(차트 강조·인사이트)** | ✅ 완료 | ADR-011, 실 E2E + LibreOffice 렌더 |
| **품질: Deck Doctor 진단 + AI 자동 수정** | ✅ 완료 | ADR-012, 실 E2E(86→97점) + Playwright |
| **UI: 에디터 AI 도구(노트·질문·접근성·번역·리라이트)** | ✅ 완료 | 백엔드+UI, Playwright ai-tools |
| **UI: 슬라이드 디자인 변형(3종 미리보기·교체)** | ✅ 완료 | 백엔드+UI, Playwright slide-variants |
| **UI: CSV→차트 덱(위저드 보조 경로)** | ✅ 완료 | 백엔드+UI, Playwright csv-import |
| **UI: AI 설정(모델 연결·프롬프트 편집)** | ✅ 완료 | 백엔드+UI, Playwright ai-settings |
| **워터폴 차트(순차 증감 누적)** | ✅ 완료 | computeWaterfall, 렌더러+익스포터, 실 PPTX 렌더 육안 |
| **P11.1 템플릿 갤러리(실 미리보기·16종·미리보기 모달)** | ✅ 완료 | buildSampleDeck, Canva식 갤러리, Playwright |
| **P11.3 디자인 엔진(리치 레이아웃 6종, 10→16)** | ✅ 완료 | timeline/comparison/kpi-grid/cards/bignum/roadmap, 실 claude 자동선택 |
| **P11.2 템플릿 흡수(유저 PPTX→내 템플릿)** | ✅ 완료 | 색+폰트 추출, applyBranding, 실 도담도담 템플릿 E2E |
| **P11.4 템플릿 대량 반입(16→113종)** | ✅ 완료 | 스타일팩 16 + design-diversity 60 + reveal/Marp/Catppuccin 21, 색·폰트·팩 폰트 웹로딩 |
| **P11.5 디자인 시스템 엔진(10종)** | ✅ 완료 | themeStyle + decorate 후처리(대문자·키커·액센트·grid/ruled/gradient/watermark·카드 보더), 113종 매핑, Playwright 육안 |
| **오버플로 자동수정(넘칠 때 폰트 축소)** | ✅ 완료 | fitFontSize + PPTX normAutofit, 단위+실 export |
| 덱 번역 · 리라이트(톤/길이) | ✅ 완료 | P10, 실 claude E2E |
| 접근성 검사(WCAG 대비/alt) | ✅ 완료 | P10a |
| Playwright 브라우저 E2E 하네스 | ✅ 완료 | 게이트·편집·발표 E2E 5건 |
| **P12.1 프리미엄 레이아웃 7종(→22종)** | ✅ 완료 | section·statement·feature-quote·split-feature·hero-image·feature-grid·closing, 실 claude 자동선택 |
| **P12.2 에디터 슬라이드 단위 관리** | ✅ 완료 | 추가/복제/이동/삭제, Playwright slide-management |
| **P12.3 PDF/PNG export(헤드리스 렌더)** | ✅ 완료 | renderDeckToPdf/Pngs, png=zip, 실 export 검증 |
| **P12.4 브랜드 URL 임포트(색·폰트 추출)** | ✅ 완료 | /templates/from-url, SSRF 방어, 단위 18(url-extract+catalog) |
| **P12.5 템플릿 시퀀스 + 디자인 시스템 20종** | ✅ 완료 | layoutOrder(데이터 레이아웃 보존) + 시스템 10→20·해시 분산 폴백, 단위 17 + Playwright sequence |
| **P12.6 스톡 이미지 피커(Pexels/Unsplash)** | ✅ 완료 | 편집기 검색·삽입, 키리스 안전, SSRF 방어, 단위 9 + Playwright stock-picker |
| **PPT 20선 R1~R6 재현(팔레트 실측+시퀀스)** | ✅ 완료 | reference-specs SSOT, 테마 20 + 팔레트 변형 47, 신규 레이아웃 8종 |
| **PPT 20선 1:1 정밀 수렴(표지 4종+시퀀스 교정)** | ✅ 완료 | masthead(dark)·editorial-headline·ring·report-cover, 20종 시그니처 표지/본문 실측 대조 |
| **Phase B 파생(변형 시퀀스 상속 + 분야 14종)** | ✅ 완료 | 팔레트 변형이 베이스 충실 시퀀스 상속, 다른 분야·컨셉 필드 14종 → PPT 패밀리 81종 |

## 관통 완료 흐름 (실데이터 검증)

- **생성(게이트)**: 프롬프트 → (리서치→팩트) → **목차 승인** → **슬라이드별 계획 승인** → 생성 → 출처 슬라이드 포함 PPTX
- **생성(빠르게)**: 프롬프트 → SSE 실시간 표시 → 편집 가능 PPTX
- **영속/잡**: 덱·잡·설정 Postgres 영속, 생성 detach + 재접속 재생 + 크래시 복구
- **편집**: 에디터 Copilot(AI 페이지 재생성) + WYSIWYG(캔버스 텍스트 인라인 편집→저장)
- **셀프호스트**: `docker compose up`(db+api+web)

## 잔여 (외부 의존/헤비만)

코드로 닫을 수 있는 갭은 모두 닫음. 아래는 **외부 API 키·별도 인프라·니치**만 남음:

- **Pexels 스톡 사진** — 사진형 이미지는 API 키 필요(현재 AI 이미지는 claude -p SVG로 무키 구현됨)
- **PNG export** — 헤드리스 브라우저 렌더 인프라 필요(PPTX/PDF는 완료)
- **Mekko(Marimekko) 차트** — 니치(워터폴은 완료)
- **Excel(.xlsx) 파싱** — 라이브러리 추가(CSV·PDF·DOCX·TXT·MD는 완료)
- **템플릿 15종+ / 커스텀 템플릿 저장 / 브랜드킷 동적 리팩터** — 테마 영속 확장
- **화면비 완전 스윕 / 발표자 뷰 / 조회 애널리틱스** — 별도 아키텍처 작업

전체 Phase 계획은 [ROADMAP.md](06-devlog/ROADMAP.md) 참고.
