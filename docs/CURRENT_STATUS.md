# CURRENT STATUS

> 마지막 업데이트: 2026-07-04 · **P2~P10 완성 + 콘텐츠 품질 개선 트랙 완료** — 딥리서치 기반 6레버(Action Title·발표 유형 10종·유형별 디자인 매칭·데이터 스토리텔링·Deck Doctor 진단·AI 자동 수정). 패키지 회귀 211·Playwright 4 신규·실 claude E2E 다수·origin/dev 푸시
>
> **모든 백엔드 기능이 UI로 연결됨** + **워터폴 차트·오버플로 자동수정 완료**. Playwright 18 스펙 전체 그린(8.5분), 패키지 회귀 220. 남은 것: Pexels 스톡 사진(키)·PNG export(헤드리스 렌더)·Mekko 차트·Excel 파싱 — 외부 의존 또는 별도 인프라 필요 항목만.

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
| **오버플로 자동수정(넘칠 때 폰트 축소)** | ✅ 완료 | fitFontSize + PPTX normAutofit, 단위+실 export |
| 덱 번역 · 리라이트(톤/길이) | ✅ 완료 | P10, 실 claude E2E |
| 접근성 검사(WCAG 대비/alt) | ✅ 완료 | P10a |
| Playwright 브라우저 E2E 하네스 | ✅ 완료 | 게이트·편집·발표 E2E 5건 |

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
