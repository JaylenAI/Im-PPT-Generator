# ADR-012: Deck Doctor (슬라이드 품질 진단)

- 상태: 채택(Accepted)
- 날짜: 2026-07-04
- 관련: [ADR-009 Action Titles](./ADR-009-action-titles.md), [ADR-011 데이터 스토리텔링](./ADR-011-data-storytelling.md)

## 맥락

품질 레버(Action Title·발표 유형·데이터 스토리텔링)로 좋은 덱을 **생성**하게 됐지만,
생성 결과가 실제로 발표 보조물 원칙을 지키는지 **검증·개선**할 도구가 없었다.
Ghost Deck(ADR-009)은 아웃라인 레벨 "제목만 읽어 논리가 통하나"만 본다.
슬라이드 레벨 "각 장이 과밀하지 않은가, 데이터 슬라이드가 스토리를 담았나"는 사각지대.

## 결정

덱 JSON을 프레젠테이션 베스트프랙티스로 스캔하는 **순수 함수 `diagnoseDeck(deck)`**
(core/pipeline/doctor.ts)을 만든다. 목/LLM 없이 결정론적으로 판정 → 편집 게이트·품질 배지로 소비.

### 진단 항목 (딥리서치 기반, 임계값은 한 곳에 상수화)

| kind | 심각도 | 기준 | 근거 |
|---|---|---|---|
| `bullet-overload` | medium | 글머리 > 6개 | 6x6 규칙 |
| `wordy-bullet` | low | 항목 > 42자 | 한 줄 원칙 |
| `text-wall` | medium | 본문 텍스트 > 220자 | 발표 보조물(읽는 문서 아님) |
| `chart-no-story` | medium | 차트에 highlightIndex도 insight도 없음 | ADR-011 데이터 스토리텔링 |
| `overcrowded` | low | 콘텐츠 요소 > 8개 | 한 슬라이드=한 메시지 |
| `empty` | medium | 제목 외 콘텐츠 없음(title/closing/quote 등 제외) | 빈 장 방지 |

### 점수·소비

- `score` = 100 − Σ(high 15, medium 8, low 3), 0 하한. `issues[]`에 {slideIndex, kind,
  severity, message, suggestion}.
- API: `GET /decks/:id/doctor`. 웹: 에디터 "품질 진단" 버튼 → `DeckDoctorView`(점수 원형 +
  슬라이드별 개선점·제안).

## 근거

- **품질 루프 완성**: 생성(Action Title·유형·데이터) → 진단(Doctor) → 개선. 딥리서치의
  "품질 루브릭 통과" 방향과 일치.
- **결정론적·투명**: 규칙과 임계값이 코드에 노출 → 왜 지적됐는지 명확, 조정 쉬움. LLM 판정의
  비결정성·비용 회피.
- **확장 용이**: 진단 항목 추가 = `diagnoseSlide`에 체크 1개. 임계값은 상단 상수.

## 검증

- 단위 6(건강한 덱 100점, bullet-overload, text-wall, chart-no-story 양/음성, empty의
  title 제외) — core 회귀 그린
- 실 claude E2E: 정상 생성 덱(consulting 6장) → 97점(과밀 1건만). **나쁜 슬라이드 주입
  PATCH 라운드트립** → 97→78점, 4이슈 정확 포착(8글머리·긴항목·텍스트벽·과밀)
- Playwright: 에디터 진단 뷰 점수·이슈 목록 표시

## 대안 (기각)

- **LLM 기반 품질 평가**: 비결정적·비용·왜 지적됐는지 불투명 → 규칙 기반 결정론.
- **생성 시 자동 차단(하드 게이트)**: 창작 자유 침해 → 진단·제안만(사용자가 판단).

## 확장 — AI 자동 수정 (autoFixDeck)

진단(규칙)과 수정(생성)을 잇는 마지막 고리. `autoFixDeck(deck, deps)`:
- 진단 이슈를 슬라이드별로 그룹핑 → 이슈 종류를 **editSlide 지시 문구로 번역**
  (bullet-overload→"6개 이하로", text-wall→"요점만", chart-no-story→"highlight+insight 추가").
- 슬라이드별로 기존 `editSlide`(레이아웃 계약 유지 재생성) 호출 → `replaceSlide`로 교체.
  **새 LLM 경로를 만들지 않고 P4 편집 인프라를 재사용**.
- overcrowded(요소 재배치 필요)는 콘텐츠 재작성으로 안전히 못 고치므로 자동 수정 제외.
- 반환: 개선된 덱 + before/after 진단(점수 델타) + fixedSlides + 비용. 부분 실패 허용.
- API: `POST /decks/:id/doctor/fix`(저장까지). 웹: 진단 뷰 "AI 자동 수정" 버튼 → 점수 개선 표시.
- 검증: 단위 2(fake provider로 8글머리→개선·건강덱 무수정), 실 claude E2E — 나쁜 슬라이드
  주입 후 86→97점(bullet/wordy 해소, overcrowded 유지), Playwright 원클릭 수정 플로우.
