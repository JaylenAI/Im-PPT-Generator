# CODING STANDARDS — 코딩 규칙

> 근거: 레퍼런스 3프로젝트(GC-Agent/ai-news-hub/rag-studio) 분석에서 수렴한 기업급 패턴 + 글로벌 규칙.

## 구조 원칙

1. **하드코딩 금지** — 운영 노브(모델명, 임계값, 프롬프트, URL)는 설정 카탈로그/DB/env로. 색상은 `token:*` 참조.
2. **프롬프트-as-data** — 모든 LLM 프롬프트는 `packages/core/prompts/catalog.ts`(SSOT) + DB override. 코드에 인라인 프롬프트 금지.
3. **레지스트리/팩토리 확장** — LLM 프로바이더, 레이아웃, 검색 어댑터는 `register()` 1줄로 추가 가능한 구조. 분기문(switch) 증식 금지.
4. **데이터 계층 격리** — DB 쿼리는 `packages/db`에만. 타 패키지의 직접 접근은 ESLint `no-restricted-imports`로 차단(P2).
5. **dead-param 금지** — 입력받지만 무시하는 파라미터는 에러로(rag-studio 교훈).
6. **도메인 라우터 분리** — 라우트 파일 1개=1도메인. 모놀리식 api 파일 금지(GC-Agent 5512줄 반면교사).
7. **파일 크기** — 200~400줄 권장, 800줄 초과 금지. 초과 시 도메인 기준 분리.

## 코드 스타일

- **불변성**: 객체/배열 뮤테이션 금지 — spread/새 객체 반환. 상태 기계 전이도 새 객체.
- **에러 핸들링**: 상류 API(LLM/검색) 호출은 반드시 try-catch + 문맥 있는 에러로 재던짐. 무성 폴백(silent fallback) 금지 — 실패는 `job_error` 이벤트/`{error}` 응답으로 표면화.
- **입력 검증**: 모든 API 입력·LLM 출력은 zod `safeParse`. `as` 캐스팅으로 검증 우회 금지.
- **console 금지**: `apps/api`는 `lib/logger.ts`(구조화 JSON), 웹은 개발 중 제거. 로그에 PII/시크릿 금지.
- **함수 50줄 이내**, 중첩 4단계 이내.
- 주석: 의도가 비자명할 때만(한국어 OK). 변수/함수명 영문.

## zod v4 주의사항 (실측)

- `.default(value)`는 기본값을 **재파싱하지 않음** — 내부 필드 기본값까지 채우려면 `.prefault({})` 사용
- `z.string().url()`/`.datetime()`은 동작하나 v4 스타일은 `z.url()`/`z.iso.datetime()` — 현재 코드베이스는 string 메서드 스타일로 통일(동작 확인됨)

## 요소 타입 추가 절차 (충실도 보증)

새 슬라이드 요소 타입은 다음 4곳을 **한 PR에서 동시에** 구현해야 한다:
1. `packages/schema/src/elements.ts` — 스키마 + 단위 테스트
2. `packages/renderer` — 웹 렌더
3. `packages/exporter` — PptxGenJS 매핑 + export 스냅샷 테스트
4. `docs/02-architecture/DATA_MODEL.md` — 문서 갱신

하나라도 빠지면 "웹에는 보이는데 PPTX에서 사라지는" 요소가 생긴다 — 리뷰에서 반드시 확인.

## API 계약

- 응답: 성공 `{data}` / 실패 `{error:{code,message}}` — 절대 혼용 금지
- 미들웨어 합성 패턴: `withErrorHandler(handler)` (ai-news-hub 방식)
- 라우트 핸들러는 얇게 — 비즈니스 로직은 core/서비스 함수로
