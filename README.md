# Im PPT Generator

**End-to-End AI 프레젠테이션 에이전트** — 자료조사(딥서치+출처 검증)부터 목차 설계, 슬라이드별 디자인 계획 보고/승인(HITL), 실시간 생성 스트리밍, 수동 편집, PPTX/PDF export까지 전 과정을 수행하는 AI Agent 플랫폼.

## 핵심 설계 원칙

1. **슬라이드 JSON 스키마 = 단일 진실(SSOT)** — `packages/schema`(Zod). 웹 렌더러·에디터·PPTX 익스포터·LLM 출력 계약이 모두 같은 스키마를 공유한다.
2. **AI는 디자인하지 않는다. 고르고 채운다** — 검증된 레이아웃 변형(templates) 중 선택 + 스키마 검증된 콘텐츠 생성. 오버플로/불균형 방지의 핵심.
3. **할루시네이션 제로** — 모든 팩트는 소스 ID로 역추적, 팩트 승인 게이트 통과분만 슬라이드에 반영.
4. **HITL 3게이트** — ① 리서치 팩트 승인 → ② 아웃라인 승인 → ③ 슬라이드별 계획 승인(자율도 레벨로 조절).
5. **의미 단위 SSE 스트리밍** — `slide_delta` 이벤트로 슬라이드가 실시간으로 그려지는 UX.

## 구조

```
apps/
  api/          Hono API 서버 (도메인 라우터 분리)
  web/          TanStack Start 웹앱 (P1, flow-deck-creator 편입)
packages/
  schema/       Zod 슬라이드/덱/이벤트 스키마 — SSOT
  core/         파이프라인 오케스트레이터 + 프롬프트 카탈로그 + LLM 프로바이더 레지스트리 (P1)
  templates/    테마(디자인 토큰) + 레이아웃 변형 카탈로그 (P1)
  renderer/     React 슬라이드 렌더러 (웹 표시/편집 공용) (P1)
  exporter/     PptxGenJS/PDF 익스포터 (P1)
  research/     딥서치 + 스크레이핑 + citation 추적 (P2)
  db/           Supabase 데이터 계층 (다른 곳에서 DB 직접 접근 금지) (P2)
```

## 개발

```bash
pnpm install
pnpm test        # 전체 테스트
pnpm typecheck   # 타입 검사
pnpm dev         # 개발 서버
```

- 요구사항: Node >= 22, pnpm >= 10
- 환경변수: `.env.example` 참고 (`.env`는 커밋 금지)

## 문서

- [로드맵](docs/06-devlog/ROADMAP.md) — 전체 Phase 계획과 진행 상태
- [현재 상태](docs/CURRENT_STATUS.md)
- [전체 문서 인덱스](docs/README.md) — 모듈별 진행률
- [아키텍처](docs/02-architecture/SYSTEM_ARCHITECTURE.md) — 시스템 구조와 데이터 흐름
