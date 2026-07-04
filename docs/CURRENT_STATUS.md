# CURRENT STATUS

> 마지막 업데이트: 2026-07-04

## 모듈별 진행률

| 모듈 | 상태 | 비고 |
|---|---|---|
| 모노레포 셋업 (pnpm+turbo+TS strict) | ✅ 완료 | P0 |
| `packages/schema` — 덱/슬라이드/이벤트/GenerationConfig SSOT | ✅ 완료 | P0, 단위 29 |
| `packages/templates` — 테마 2종 + 레이아웃 8종 | ✅ 완료 | P1, 단위 49 |
| `packages/core` — 파이프라인/프롬프트/프로바이더(claude-cli) | ✅ 완료 | P1, 단위 34 + 통합 |
| `packages/exporter` — PptxGenJS PPTX | ✅ 완료 | P1, 단위 9 + E2E |
| `packages/renderer` — React 슬라이드 렌더러 | ✅ 완료 | P1, 단위 5 |
| `apps/api` — 덱/Export/카탈로그/설정 라우트 | ✅ 완료 | P1, 단위 13 |
| `apps/web` — Vite+React 브라우저 MVP | ✅ 완료 | P1, 빌드+HTTP E2E 검증 |
| `packages/db` — Postgres+Drizzle 덱 영속 | 🔄 진행중 (2026-07-04) | P2, 단위+실PG 통합 |
| SSE 실시간 생성 스트리밍 | ✅ 완료 (2026-07-04) | P2, 실 claude 검증 |
| `packages/research` — 딥서치+인용 | ❌ 미개발 | P3 |

## P1 MVP 상태: ✅ 관통 완료 (v0.1.0 후보)

**프롬프트 → claude -p 아웃라인 → 슬라이드 병렬 생성 → 웹 렌더 → 편집 가능한 PPTX 다운로드**가 실 API로 관통. HTTP 풀플로우 검증 완료(생성→export→다운로드 유효 pptx). LibreOffice 렌더 육안 확인.

### P1 잔여(폴리시, 후속)
- Playwright 브라우저 E2E(현재 vite build + HTTP curl로 검증, 브라우저 자동화는 미구축)
- 생성 속도/비용 최적화(CLI 콜드스타트, 슬라이드당 ~$0.3)
- eslint config, apps/web를 flow-deck-creator 풀 UI로 확장(현재 lean MVP)

전체 Phase 계획은 [ROADMAP.md](06-devlog/ROADMAP.md) 참고.
