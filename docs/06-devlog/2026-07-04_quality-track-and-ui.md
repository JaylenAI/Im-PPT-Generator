# Devlog — 콘텐츠 품질 트랙 + UI 완전연결 + 워터폴·오버플로 (2026-07-04)

> dev=origin/dev(`61e7c93`), feature 브랜치 → 로컬 merge commit → push. 각 단계 실 claude E2E + Playwright.

P2~P10 완성 위에 **딥리서치(Minto Pyramid·Alley Assertion-Evidence·Kawasaki·IMRaD·PAS·McKinsey)** 기반으로 콘텐츠 품질을 끌어올리고, 백엔드만 있던 기능의 UI를 모두 붙이고, 남은 헤비 항목(워터폴·오버플로)까지 마감했다.

## 1. 콘텐츠 품질 6레버

- **Action Title**(ADR-009) — 슬라이드 제목 = 짧은 라벨 → 완결된 결론 문장(assertion). outline이 assertion 생성(title은 라벨로 분리), slide 헤드라인=assertion. `checkGhostDeck`(Titles Test 순수 검증) + 에디터 "제목 점검" 뷰.
- **발표 유형 10종**(ADR-010) — general/interview(STAR)/consulting(SCQA)/ir_pitch(Kawasaki)/academic(IMRaD)/sales(PAS)/lecture/workshop/business_review/product_demo. `PRESENTATION_TYPES` 데이터 카탈로그(SSOT) → `renderScaffold`로 outline 프롬프트 주입. **유형별 자동 테마 매칭**(defaultThemeId, 사용자 명시 선택 우선). 생성 위저드 선택기.
- **데이터 스토리텔링**(ADR-011) — 차트 `highlightIndex`(핵심 수치만 accent, 나머지 흐리게, 렌더러+익스포터), insight 'so what' 주석, 레이아웃 리듬(연속 2회 금지).
- **Deck Doctor**(ADR-012) — `diagnoseDeck` 순수 함수(6x6·텍스트벽·차트 스토리 누락·과밀·빈 슬라이드, 점수 0~100) + **AI 자동 수정**(`autoFixDeck` = 진단 이슈를 editSlide 지시로 번역, P4 편집 인프라 재사용).

실 claude E2E: interview=STAR 구조, ir_pitch=Kawasaki 구조로 차별화 확인. 통합 E2E — consulting 덱에 자동 mono-slate 테마 + SCQA Action Title + 차트 highlightIndex + Doctor 91점 + PPTX 7p 렌더가 함께 동작.

## 2. 백엔드 8종 UI 완전연결

기존에 API·MCP만 있고 웹 UI가 없던 기능을 모두 연결(먼저 실 호출로 백엔드 전수 검증):
- **에디터 "AI 도구" 드롭다운** — 발표자 노트·예상 질문·접근성 점검·번역(언어 7종)·리라이트(톤 프리셋 4+자유)
- **Copilot "다른 디자인 보기"** — 슬라이드 변형 3종 실렌더 썸네일 → 클릭 교체
- **생성 위저드 CSV 카드** — CSV→차트 덱 즉시(LLM 없음)
- **/settings 화면** — 모델 연결(읽기) + 프롬프트 편집(override·기본값 복원) + 사이드바 링크

## 3. 워터폴 차트 + 오버플로 자동수정

- **워터폴** — `computeWaterfall`(순수 계산) + 렌더러 SVG(떠 있는 막대: 증가=success·감소=error·총계=primary) + 익스포터 스택 막대 기법(투명 base). PptxGenJS native 미지원을 우회. 실 PPTX→LibreOffice 육안 확인.
- **오버플로 자동수정** — `fitFontSize`(문자폭 근사, 이진탐색) → 렌더러 텍스트·리스트 폰트 클램프 + 익스포터 `fit:'shrink'`(PPTX `normAutofit`, PowerPoint native).

## 검증

- 패키지 회귀 **220** (schema 49·core 65·renderer 9·templates 61·exporter 9·research 16·db 11)
- Playwright **18 스펙 전체 그린**(8.5분) — 신규 ai-tools·slide-variants·csv-import·ai-settings + 기존 14
- 실 claude E2E 다수, 실 PPTX→LibreOffice 육안(워터폴·오버플로·데이터 스토리텔링)

## 워크플로 메모

- 각 기능 feature 브랜치 → dev merge commit → push (사용자 승인 방식). Deck Doctor 진단 커밋 1건은 브랜치를 안 파고 dev 직접 커밋한 슬립 → 즉시 보고, 이미 푸시라 되돌리지 않음(이후 엄수).
- 교훈: 테스트 추가 후 typecheck 재실행 필수(vitest는 타입체크를 안 해 optional-color 접근 잠복 오류를 다음 브랜치에서 발견).

## 남은 것 (외부 의존/헤비만)

Pexels 스톡 사진(API 키) · PNG export(헤드리스 브라우저 인프라) · Mekko 차트 · Excel(.xlsx) 파싱. 코드로 닫을 수 있는 갭은 모두 닫음.
