# ADR-003: HITL 3게이트 + GenerationConfig(설정 주도 파이프라인)

- 상태: ✅ 확정 (2026-07-03) · 개정 2026-07-04(자율도 레벨 → GenerationConfig로 일반화)

## Context

핵심 요구: "AI가 페이지별로 어떻게 만들지 실시간 보고하고 허락받으며 제작". 14개 경쟁 제품 조사 결과 아웃라인 승인까지만 존재하고 **슬라이드별 계획 승인은 전무**(시장 공백). 반면 Manus는 게이트가 아예 없어 "중단해야 개입 가능"이 약점.
추가 요구(2026-07-04): 사용자가 템플릿·주제·자료를 이미 갖고 있으면 리서치를 건너뛰고 바로 설계로 진입하는 등, **모든 단계를 자유롭게 켜고 끌 수 있어야 한다**. 단일 자율도 레벨(L0~L3)만으로는 이 조합 자유도를 표현 못 한다.

## Decision

파이프라인에 게이트 3종을 정식 단계로 둔다: **① facts** → **② outline** → **③ slide_plan**. 게이트는 `gate_waiting` SSE 이벤트로 표면화되고, 잡은 승인 입력까지 대기한다.

**파이프라인 전체를 `GenerationConfig`(SSOT, `generation-config.ts`)가 제어한다.** 파이프라인은 고정 직선이 아니라, 각 단계가 `(config, 현재 덱 상태)`를 읽어 실행/스킵을 결정하는 조건부 단계열이다(분기 하드코딩 금지 — ADR-002/CODING_STANDARDS와 동일 철학):

- `researchMode`: `off | user_only | web | deep` — 딥서치 강도. `user_only`면 웹서치 스킵, 제공 자료만 팩트화.
- `outlineSource`: `ai | user` — 사용자가 목차를 주면 "생성"이 "검증"으로 바뀜.
- `templateId/themeId`: 미지정이면 AI가 선택, 지정이면 그 단계 스킵.
- `gates`: `{ facts, outline, slidePlan }` 독립 불리언.
- `imageMode`: `none | stock | generate | mixed`.

**자율도 L0~L3는 이제 config의 프리셋(별칭)일 뿐이다**: quick(L0)/standard(L1)/research(L2)/precision(L3) + my_materials(제공 자료만). UI는 프리셋을 노출하고 "고급"에서 개별 스위치를 오버라이드한다(`resolveGenerationConfig` = 프리셋 병합 + gates 딥머지).

### 단계 스킵 규칙(요지)

| 단계 | 실행 조건 |
|---|---|
| 자료 수집(ingest) | 사용자 제공 자료 있으면 항상 |
| 웹 리서치 | `researchMode ∈ {web, deep}` |
| 팩트 승인 게이트 | `gates.facts` |
| 목차 생성 | `outlineSource === 'ai'` (아니면 검증만) |
| 목차 승인 게이트 | `gates.outline` |
| 슬라이드 계획+게이트 | `gates.slidePlan` |
| 템플릿 선택 | `templateId` 미지정 시에만 |

## Consequences

- (+) 시장 공백 차별화 + "이미 자료 있으면 바로 설계로" 같은 임의 진입점 자유
- (+) 파이프라인 로직이 config 한 곳에서 결정 → 새 단계/토글 추가가 선형적, 테스트 가능
- (+) 게이트·config가 스키마로 정의되어 UI/API/잡이 같은 계약 공유
- (−) 잡이 장시간 대기 가능 → 잡 상태 영속+타임아웃 정책 필요(P2)
- (−) 조합 폭발 → 유효하지 않은 조합(예: `researchMode=off` + `gates.facts=on`)은 resolve 단계에서 정규화/경고 필요(P4에서 검증 규칙)
