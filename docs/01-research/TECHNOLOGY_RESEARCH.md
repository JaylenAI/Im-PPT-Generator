# TECHNOLOGY RESEARCH — 기술 리서치 (2026-07-03)

> AI PPT 제품 구축을 위한 기술 검증. 결론은 [ADR](../02-architecture/)로 확정.

## 1. 슬라이드 렌더링/생성 아키텍처 3방식 비교

| 방식 | 사용 제품 | 장점 | 치명적 단점 | 판정 |
|---|---|---|---|---|
| (a) HTML 자유 렌더 → 사후 PPTX 변환 | Genspark, Manus, Gamma | 비주얼 자유도 최고 | export 깨짐(Gamma 고질), 복잡 표/차트 이미지 폴백(Genspark 공식 인정), 변환기 유지보수 무한 | ❌ 기각 |
| (b) 직접 PPTX 생성(python-pptx 단독) | 리딩 제품 없음 | 왕복 무손실 | LLM 좌표 직접 산출 시 오버플로/겹침 빈발, 품질 상한 낮음 | ❌ 기각 |
| **(c) JSON 스키마 → 듀얼 렌더러(웹+PPTX)** | Beautiful.ai, Canva, PPTist, Presenton | 편집성+export 충실도+페이지 단위 수정 동시 성립 | 레이아웃을 직접 만들어야 함 | ✅ **채택** |

핵심 통찰: **AI에게 디자인을 시키면 반드시 깨진다.** 레이아웃은 코드(검증된 변형), AI는 선택+콘텐츠 채움만 — Beautiful.ai Smart Slides와 Presenton(TSX+Zod 레이아웃)이 검증한 방식.

## 2. PPTX Export 라이브러리

| 라이브러리 | 상태 | 판정 |
|---|---|---|
| **PptxGenJS** | 활발, JS 표준, 텍스트/도형/차트/표/마스터 지원. Anthropic pptx skill의 백엔드 | ✅ **채택** (exporter) |
| python-pptx v1.0 | 안정. 읽기+쓰기, 마스터/레이아웃/placeholder 접근 | ✅ 채택 (P6 PPTX 업로드 **파서** 전용, 별도 서비스) |
| officegen | 2021년 이후 사망 | ❌ |
| docxtemplater | placeholder 치환 전용, 고급 모듈 유료 | ❌ (자유 생성에 부적합) |
| Aspose.Slides | 충실도 최고, ~$4K/yr | ❌ (비용) |
| dom-to-pptx / Anthropic html2pptx | HTML 계측→변환. 아이콘/그라디언트 래스터화 | 참고만 (방식 (a)용) |

**공통 한계(설계로 회피)**: 폰트는 이름 참조 → **안전 폰트 세트로 제한**. CSS 그라디언트/SVG는 1:1 변환 불가 → **스키마 요소를 PptxGenJS가 표현 가능한 것으로 제한**. 텍스트 리플로우 없음 → **폰트 메트릭 계측 + 단계 축소**를 렌더러/익스포터 공용 로직으로.

## 3. 오픈소스 스켈레톤

| 리포 | ★ | 라이선스 | 차용 포인트 |
|---|---|---|---|
| [presenton/presenton](https://github.com/presenton/presenton) | 8.7k | Apache 2.0 | 레이아웃=TSX+Zod 스키마, PPTX→AI 템플릿 추출, overflow 재시도 루프, API-first. **구조 차용 1순위** |
| [pipipi-pikachu/PPTist](https://github.com/pipipi-pikachu/PPTist) | ~7k | AGPL계열 | 웹 PPT 에디터 설계 교재(DOM 절대좌표). ⚠️**코드 반입 금지**(라이선스), 설계 참고만 |
| [icip-cas/PPTAgent](https://github.com/icip-cas/PPTAgent) | 4.8k | MIT | 레퍼런스 PPTX 분석→기능유형+스키마 추출(EMNLP 2025). P6 업로드 파싱의 교재 |
| allweonedev/presentation-ai | 2.9k | MIT | 반면교사: PPTX export "부분 완성" 자인 |

캔버스 라이브러리(fabric/konva/tldraw)는 **비채택** — canvas 기반은 리치텍스트/반응형이 어렵고, PPTX 좌표계와는 **DOM 절대좌표 렌더러**가 가장 잘 맞음(PPTist 방식).

## 4. 딥리서치/검색 API

| API | 가격 | 특징 | 판정 |
|---|---|---|---|
| **Tavily** | $5~8/1k | 인용 친화 스니펫, LangChain 표준. 2026-02 Nebius 인수 | ✅ 기본 |
| **Serper** | $0.3~1/1k | 최저가 Google SERP | ✅ 폴백/대량 |
| Exa | 쿼리당 상위10 전문 무료 | 시맨틱 강함, 시의성 약함(FreshQA 24%) | 보류 |
| Firecrawl / Jina Reader | — | 본문 추출 스크레이핑 | ✅ 병용 |

파이프라인: 검색 → 페치 → 소스 ID 부여 → 팩트 추출 → 승인 게이트 → `citations[]` 전파. Skywork(GAIA 82.42)의 "팩트를 아웃라인에 잠금" 패턴 차용.

## 5. 실시간 스트리밍 UX

- **SSE 단방향으로 충분**(WebSocket 불요). 토큰이 아닌 **의미 단위 이벤트**: `research_started → outline_ready → slide_started(n) → slide_delta(n) → slide_done(n) → export_ready`
- 부분 JSON 스트리밍: Vercel AI SDK `streamObject`(스키마 기반 partial object) 또는 Claude 스트리밍+증분 파서
- 이벤트를 잡 테이블에 영속 → 재접속 시 재생 (Im-Shorts-Creator SSE 패턴 재사용)
- AG-UI 프로토콜(CopilotKit)이 표준화 후보 — 계약은 자체 스키마(`events.ts`)로 유지하되 호환 가능하게

## 6. 이미지 생성

- Gemini 이미지(Nano Banana Pro): 텍스트 렌더링 포함 인포그래픽급, ~$0.134/장 → 덱당 $1~2 원가
- **전략**: 스톡(Pexels 무료) 폴백 혼합 + 이미지 필요 슬라이드만 선별 생성 (Presenton 구조)

## 7. 난이도 평가 (정직한 순위)

1. **디자인 품질 일관성** — 템플릿 커버리지 축적이 제품 수명 전체의 일. 15~30종 범위 내에서는 Gamma와 체감 격차 작음
2. **PPTX export 충실도** — 스키마 제한으로 관리 가능 수준
3. **텍스트 오버플로** — 폰트 메트릭 계측 직접 구현 필요
4. **이미지 단가** — 기술보다 비용 관리 문제
5. **야생 PPTX 파싱** — placeholder 없는 자유 배치는 연구급(PPTAgent). v1 스코프 컷

## 출처

Genspark FAQ/changelog · Gamma export 가이드 · Manus Slides 문서 · Presenton docs/DeepWiki · PPTAgent 논문(arXiv:2501.03936) · PptxGenJS/python-pptx 공식 문서 · anthropics/skills(pptx) · Firecrawl 검색 API 비교(2026-05) · 상세 URL은 [COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md) 하단 참조
