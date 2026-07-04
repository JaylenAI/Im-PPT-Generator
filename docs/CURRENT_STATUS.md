# CURRENT STATUS

> 마지막 업데이트: 2026-07-04 · dev=`d429675`

## 모듈별 진행률

| 모듈 | 상태 | 비고 |
|---|---|---|
| 모노레포 셋업 (pnpm+turbo+TS strict) | ✅ 완료 | P0 |
| `packages/schema` — 덱/슬라이드/이벤트/GenerationConfig SSOT | ✅ 완료 | P0, 단위 29 |
| `packages/templates` — 테마 2종 + 레이아웃 8종 | ✅ 완료 | P1, 단위 49 |
| `packages/core` — 파이프라인/프롬프트/프로바이더(claude-cli)/편집 | ✅ 완료 | P1+P4, 단위 37 + 통합 |
| `packages/exporter` — PptxGenJS PPTX | ✅ 완료 | P1, 단위 9 + E2E |
| `packages/renderer` — React 슬라이드 렌더러 | ✅ 완료 | P1, 단위 5 |
| `packages/db` — Postgres+Drizzle 덱 영속 | ✅ 완료 | P2, 단위+실PG 통합+재시작 E2E |
| `apps/api` — 덱/Export/카탈로그/설정/스트림/편집 라우트 | ✅ 완료 | P1+P2+P4, 단위 13 |
| `apps/web` — flow-deck-creator UI 편입(TanStack Router SPA) | ✅ 완료 | P1, 실제 화면+우리 백엔드 배선 |
| SSE 실시간 생성 스트리밍 | ✅ 완료 | P2, 실 claude 검증 |
| 페이지 단위 AI 수정(에디터 Copilot) | ✅ 완료 | P4, 실 claude E2E |
| `packages/research` — 딥서치+인용 | ❌ 미개발 | P3 |
| 잡큐(재접속 재생) · 설정 UI 동적카탈로그 · docker 전체스택 | ❌ 미개발 | P2 잔여 |

## 관통 완료 흐름 (실데이터 검증)

- **생성**: 프롬프트 → claude -p 아웃라인 → 슬라이드 병렬 생성 → **SSE 실시간 표시** → 웹 렌더 → 편집 가능 PPTX 다운로드
- **영속**: 덱이 Postgres에 저장, 서버 재시작에도 유지(재시작 E2E 검증)
- **편집**: 에디터 Copilot에 지시 → 해당 페이지만 AI 재생성(다른 페이지 불변) — NotebookLM식
- **UI**: flow-deck-creator 실제 화면(대시보드/사이드바/3분할 에디터/썸네일릴/Copilot 패널)

## 잔여 (후속)

- **P2 잔여**: Postgres 잡큐(생성 재접속 재생), 설정 UI 동적 카탈로그, docker-compose 전체 스택(app/web 컨테이너)
- **P3~P10**: 리서치+팩트게이트+인용(P3), 슬라이드별 계획 승인+자율도 UI(P4 잔여), WYSIWYG 편집(P5), 템플릿 업로드/브랜드킷(P6), 입력 확장(P7), 이미지/차트(P8), 발표(P9), 번역/접근성/API·MCP(P10)
- **폴리시**: Playwright 브라우저 E2E, 생성 속도/비용 최적화(CLI 콜드스타트), eslint config

전체 Phase 계획은 [ROADMAP.md](06-devlog/ROADMAP.md) 참고.
