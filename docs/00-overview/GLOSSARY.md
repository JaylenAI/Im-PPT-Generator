# GLOSSARY — 용어 사전

| 용어 | 정의 |
|---|---|
| **덱(Deck)** | 프레젠테이션 1개의 완전한 상태. `packages/schema`의 `deckSchema`가 정의하는 JSON — 시스템의 단일 진실(SSOT) |
| **슬라이드(Slide)** | 덱의 한 페이지. `layoutType` + 요소 배열 + 노트 + 인용 + 상태(planned/generating/draft/approved) |
| **요소(Element)** | 슬라이드 위 객체 7종: text / list / image / shape / chart / table / icon. 가상 캔버스 절대좌표 `frame{x,y,w,h}` 보유 |
| **가상 캔버스** | 렌더러·익스포터 공용 좌표계. 16:9=1280×720px, 4:3=1024×768, 9:16=720×1280 |
| **테마(Theme)** | 디자인 토큰 집합(색상/폰트/타이포 스케일). 요소는 `token:colors.primary` 형태로 참조 → 테마 교체 시 전 슬라이드 반영 |
| **템플릿(Template)** | 테마 + 지원 레이아웃 변형 세트. 갤러리 노출 단위 |
| **레이아웃 변형(Layout)** | 코드로 작성된 슬라이드 구성(예: title, two-col, stat). AI는 이 중에서 **선택**만 하고 직접 디자인하지 않음 |
| **소스(Source)** | 리서치 원천(web/document/user_url/user_text). 유저 제공과 AI 수집을 동일 스키마로 취급 |
| **팩트(Fact)** | 소스에서 추출된 검증 단위(statistic/insight/quote/visual). 승인 게이트 통과분만 슬라이드에 반영 |
| **인용(Citation)** | 슬라이드 요소 ↔ 소스 연결 고리. `citationId`로 역추적 |
| **게이트(Gate)** | HITL 승인 지점 3종: ① facts(팩트) ② outline(아웃라인) ③ slide_plan(슬라이드별 계획) |
| **슬라이드 계획(Slide Plan)** | 생성 전 AI가 보고하는 페이지 설계서(layoutType+디자인 의도+내용 요약+사용 팩트) — 게이트③의 단위 |
| **GenerationConfig** | 생성 파이프라인 전체를 제어하는 설정(SSOT, `generation-config.ts`) — 딥서치 강도, 게이트 3종 토글, 목차 출처, 템플릿/테마, 이미지 모드. 파이프라인 각 단계가 이걸 읽어 실행/스킵 |
| **프리셋(Preset)** | 이름 붙은 GenerationConfig 조각: quick/standard/research/precision/my_materials. UI 노출용, "고급"에서 개별 오버라이드 |
| **자율도(Autonomy Level)** | GenerationConfig 프리셋의 별칭: L0=quick(전자동) / L1=standard(목차 승인) / L2=research(+팩트 승인) / L3=precision(+페이지별 계획 승인) |
| **researchMode** | 딥서치 강도: off(없음) / user_only(제공 자료만, 웹서치 스킵) / web(가벼운 웹서치) / deep(딥리서치+교차검증) |
| **생성 이벤트(GenerationEvent)** | SSE로 흐르는 의미 단위 이벤트(`slide_started/slide_delta/slide_done` 등). `events.ts`가 계약 |
| **slide_delta** | 생성 중인 슬라이드의 부분 JSON 패치 — "AI가 그리는 모습"을 만드는 재료 |
| **잡(Job)** | detached 생성 작업 단위. Postgres 잡큐로 실행, 이벤트를 영속해 재접속 시 재생 |
| **프롬프트 카탈로그** | 모든 LLM 프롬프트의 코드 밖 정의(prompts-as-data). DB override 가능 |
| **프로바이더 레지스트리** | 작업(task)별 LLM 라우팅 테이블(예: outline→Claude, image→Gemini) |
| **SSOT** | Single Source of Truth. 이 프로젝트에서는 `@im-ppt/schema` |
| **HITL** | Human-in-the-Loop. 사람 승인이 파이프라인의 정식 단계 |
