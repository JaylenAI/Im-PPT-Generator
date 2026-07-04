# 경쟁 제품 기능 매트릭스 (2026-07 조사)

> **조사 대상 14개**: Gamma, Genspark AI Slides, Manus Slides, Skywork, Canva AI, Beautiful.ai, Tome(사망), Pitch, Plus AI, Presentations.ai, Decktopus, SlidesAI, Alai, Presenton(OSS)
> **방법**: 병렬 웹 리서치 × 공식 문서·가격 페이지·체인지로그·서드파티 리뷰 교차 검증. Skywork/Canva/Beautiful.ai 일부는 공개 지식 기반 — **(미확인)** 표기.
> 표기: **[기본]**=table-stakes(과반 보유) / **[신흥표준]**=에이전트 세대 전원 보유 / **[차별화]**=1~2개 제품만

## 핵심 교훈 3가지

1. **Tome은 2,500만 유저로도 죽었다**(2025-04 셧다운, ARR $4M 미만): PPTX 왕복 부재 + 기업 워크플로 비호환. **Export 충실도 = 생존 조건.** (Deckary, AngelList 인수 블로그)
2. **Gamma($100M ARR)의 신뢰 원칙**: "AI는 과금, 수동 편집은 무료(0크레딧)".
3. **Manus 반면교사**: 리서치 최강이지만 아웃라인 게이트 의도적 부재 + 인용 미표기가 공식 약점.

---

## (a) 마스터 기능 체크리스트 — 10차원

### 1. 입력 모드

| 기능 | 보유 제품 | 분류 |
|---|---|---|
| 텍스트 프롬프트 → 덱 | 전 제품 | [기본] |
| 장문 붙여넣기 3모드(generate/condense/**preserve** 원문 보존) | Gamma 단독(API 노출) | [차별화] |
| 문서 업로드(PDF/DOCX) → 덱 | Gamma·Genspark·Manus·Presentations.ai·Decktopus·Plus AI·Alai·Presenton·Skywork·Canva | [기본] |
| 기존 PPTX 임포트(콘텐츠) | Gamma·Pitch·Plus AI·Alai·Genspark·Beautiful.ai·Presentations.ai | [기본] |
| **PPTX → 재사용 AI 템플릿/테마 추출** | Genspark(My Templates)·Presenton·Gamma(테마 자동 추출)·Manus·Alai(픽셀 단위 리디자인) | [신흥표준] |
| URL/웹페이지 임포트 | Gamma·Presentations.ai·Manus·Alai | [기본] |
| URL → 브랜드 추출 온보딩 | Pitch Agent·Presentations.ai Brand Sync·Decktopus | [차별화] |
| YouTube/영상 임포트 | Presentations.ai만 실동작 | [차별화] |
| CSV/Excel 데이터 임포트 | Manus·Genspark·Presenton·Pitch·Presentations.ai | [차별화] |
| 스크린샷/이미지를 콘텐츠 입력으로 | Gamma Agent·Alai·Decktopus | [차별화] |
| 음성 입력 | Genspark(Speakly)·Canva(미확인) | [차별화] |
| 이전 태스크 산출물 체이닝(리서치→덱) | Manus·Genspark Super Agent·Skywork | [차별화] |
| JSON→덱 / 슬라이드별 마크다운 정확 지정 | Presenton 단독 | [차별화] |
| ChatGPT/Claude 안에서 생성(커넥터/MCP) | Gamma·Genspark·SlidesAI·Plus AI/Alai/Presenton(MCP) | [신흥표준] |

### 2. 생성 플로우

| 기능 | 보유 제품 | 분류 |
|---|---|---|
| 아웃라인 생성→편집→승인 | Gamma·Plus AI·SlidesAI·Decktopus·Presenton(전용 API)·Skywork(미확인). **Manus는 의도적 부재** | [기본] |
| 슬라이드 수 지정(플랜별 캡: Gamma 10~75장, Alai 10~50장, Plus AI ~30장) | 대부분 | [기본] |
| 분량/톤/청중 파라미터 | Gamma(brief~extensive)·Presenton(톤6+verbosity3)·Alai | [기본] |
| **가이드 Q&A 인터뷰**(전략→구조→디자인 5단계) | Genspark Guide Mode·Decktopus | [차별화] |
| 슬라이드별 재생성/레이아웃 스왑 | 대부분 | [기본] |
| **슬라이드당 4개 디자인 변형 제시→선택** | Alai 단독 | [차별화] |
| Remix(콘텐츠 보존 레이아웃 변환) | Plus AI·SlidesAI·Presentations.ai | [차별화] |
| 문맥 맞춤 단일 슬라이드 삽입 | Plus AI·Alai(API) | [차별화] |
| 대화형 에이전트 반복 수정 루프 | Gamma·Genspark·Manus·Pitch·Presentations.ai·Alai·Presenton·Skywork | [신흥표준] |
| 1번 슬라이드 스타일 승인 후 순차 생성 | Genspark(권장 워크플로) | [차별화] |
| 품질/비용 2단 스위치(Standard 0.5×/Ultra 1×), 생성 조기 중단 | Genspark | [차별화] |
| 팀 프리셋+상시 커스텀 인스트럭션 | Plus AI | [차별화] |
| 덱 복제→변형 | Genspark·Presenton | [차별화] |
| **슬라이드별 "계획" 승인 게이트** | **전 제품 부재 — 시장 공백** ⭐우리 차별화 | — |

### 3. 리서치/그라운딩

| 기능 | 보유 제품 | 분류 |
|---|---|---|
| 웹 검색+인용 표기 | Gamma Agent·Genspark·Skywork(정체성)·Presenton(토글). **Manus는 인용 미표기(약점)** | [신흥표준] |
| 딥 리서치 모드 | Manus Wide Research·Skywork·Genspark | [차별화] |
| **원클릭 팩트체크**(근거 강/약+링크) | Genspark 단독 | [차별화] |
| 검색 프로바이더 교체(SearXNG/Tavily/Exa) | Presenton 단독 | [차별화] |
| 코드 실행으로 수치 계산 보장 | Genspark(Slides 5.0)·Manus(샌드박스) | [차별화] |
| 라이브 데이터 커넥터 50+(Salesforce/Snowflake…)+스케줄 갱신 | Presentations.ai 단독 | [차별화] |
| 프로젝트 지식/덱 메모리 | Presentations.ai(Gold)·Presenton(Mem0)·Manus | [차별화] |
| Mixture-of-Agents 교차 검증 | Genspark | [차별화] |

### 4. 디자인/편집

| 기능 | 보유 제품 | 분류 |
|---|---|---|
| 템플릿/테마(규모: Canva 수천+·Pitch 150+·Gamma/Presentations.ai/Decktopus 100+·Beautiful.ai ~65 Smart Slide·Genspark Skills 100+) | 전 제품 | [기본] |
| 브랜드킷(로고/컬러/폰트) | 대부분(유료 게이트). SlidesAI만 부재 | [기본] |
| 커스텀 폰트 업로드 | Gamma(Pro)·Pitch(Plus)·Presenton·Canva(미확인) | [기본] |
| **템플릿=코드**(HTML/Tailwind→TSX+Zod) | Presenton 단독 | [차별화] |
| **Skills 패키지**(.zip 공유 전문지식+디자인) | Genspark 단독 | [차별화] |
| 스마트/적응형 레이아웃 | Beautiful.ai(원조)·Gamma 카드·Presentations.ai anti-fragile·Alai responsive | [신흥표준] |
| 오버플로/깨짐 자동 수정 | Genspark(Fix Layout)·Presenton(재시도 루프)·Gamma(scale-to-fit) | [차별화] |
| 풀 WYSIWYG | Gamma·Pitch·Canva·Beautiful.ai 최심. Genspark Advanced Edit(2026 추가) | [기본] |
| AI 이미지 생성(모델 선택: Gamma 최다 — Flux/Ideogram/Imagen4/DALL-E3/Recraft/NBP 4K) | 전 제품 | [기본]/모델선택 [차별화] |
| **풀이미지 슬라이드인데 요소 편집 유지**(NBP) | Manus(업계 최초 주장)·Alai·Gamma Studio·Genspark Creative | [신흥표준] |
| 영역 지정 AI 편집(Mark & Edit) | Genspark·Manus | [차별화] |
| 요소/슬라이드 단위 AI 명령 | Gamma·Pitch(20+ actions)·Alai·Manus·Presentations.ai | [신흥표준] |
| 스톡 통합(Pexels: Gamma·Presenton / Unsplash 6M+로고 22M: Pitch / 1억+: Canva) | 대부분 | [기본] |
| 이미지 편집(배경 제거/확장) | Canva 최강·Pitch·Decktopus | [기본] |
| 스마트 다이어그램(퍼널/타임라인/조직도/매트릭스) | Gamma(/diagram)·Alai·Genspark | [차별화] |
| 애니메이션/트랜지션 | Canva Magic Animate·Beautiful.ai·Gamma(Ultra). **카테고리 전반 약점** | 부분 [기본] |
| 멀티 포맷 캔버스(소셜/포스터/카루셀) | Canva·Gamma·Alai 2.0·Genspark | [신흥표준] |
| 브랜드 디자인 시스템 학습(스페이싱/도형 언어까지) | Alai 2.0 단독 | [차별화] |

### 5. 차트/데이터

| 기능 | 보유 제품 | 분류 |
|---|---|---|
| 기본 차트 6종 | 대부분(SlidesAI·Decktopus 빈약) | [기본] |
| 인라인 스프레드시트 데이터 편집 | Gamma·Pitch·Beautiful.ai(미확인)·Canva | [기본] |
| 프롬프트→차트/표 | Gamma·Pitch·Plus AI·Genspark | [신흥표준] |
| **라이브 데이터 연결**(Sheets/Airtable/GA: Pitch, 50+커넥터: Presentations.ai, 대시보드 캡처 15분 갱신: Plus AI Snapshots) | 3개 제품 | [차별화] |
| Gantt/조직도/퍼널/2×2 | Genspark | [차별화] |
| **컨설팅급 차트(워터폴/Mekko/CAGR 주석)** | **전 제품 부재 — 시장 공백** | — |
| 라이브 위젯 임베드(export 시 소실) | Gamma·Pitch | [차별화] |
| 배치 개인화(변수+CSV→50덱) | Pitch 단독 | [차별화] |

### 6. 출력/Export

| 기능 | 보유 제품 | 분류 |
|---|---|---|
| PPTX export — **품질 편차가 경쟁축**: Plus AI/SlidesAI(네이티브 무손실) > Presenton/Alai/Gamma(폰트 임베드 2026-05) > Genspark(복잡 표/차트 이미지 폴백) > Decktopus(손실 큼) | 전 제품 | [기본] |
| PDF | 전 제품 | [기본] |
| Google Slides 직접 export | Gamma·Genspark·Manus (Plus AI/SlidesAI는 산출물 자체가 GSlides) | [기본] |
| 웹 링크 퍼블리싱 / 임베드 | 대부분 | [기본] |
| 커스텀 도메인 | Gamma(Pro 10/Ultra 100)·Decktopus(CNAME)·Pitch | [차별화] |
| SEO 인덱싱+GA 연동 | Gamma 단독 | [차별화] |
| PNG export | Gamma(카드별 zip)·Presenton(API) | [차별화] |
| **비디오(MP4) export** | Genspark(나레이션+보이스클론)·Canva(미확인)·Plus AI Narrator | [차별화] |
| 화면비: Gamma(fluid/16:9/4:3/A4/1:1/4:5/9:16)·Genspark(6종+21:9). **Pitch는 16:9 고정(고질 불만)** | 상위권 | [차별화] |
| 웹사이트 생성(Sites) | Gamma 단독 | [차별화] |

### 7. 발표

| 기능 | 보유 제품 | 분류 |
|---|---|---|
| 프레젠트 모드 / 발표자 뷰 | 전 제품 / Gamma(다크·줌12단)·Pitch(발표 중 노트 편집)·Canva | [기본] |
| **AI 스피커 노트** | Manus(최고평 — 앞뒤 슬라이드 문맥+별도 문서 export)·Gamma·Pitch·Decktopus·Genspark·Alai | [신흥표준] |
| 리허설/AI 코치(스코어링+예상 질문+타이머 Q&A) | **Decktopus 단독** | [차별화] |
| 음성/영상 나레이션 | Genspark(**15초 보이스 클로닝**→MP4)·Decktopus(슬라이드별 녹음)·Plus AI Narrator(다국어 TTS)·Pitch(다중 테이크 비디오)·Canva(미확인) | [차별화] |
| 폰 리모컨 | Gamma·Canva(미확인) | [차별화] |
| Co-presenting / 발표 중 스포트라이트 | Pitch / Gamma | [차별화] |

### 8. 협업

| 기능 | 보유 제품 | 분류 |
|---|---|---|
| 실시간 다인 공동편집+코멘트 | Gamma·Pitch·Canva·Presentations.ai·Decktopus·Beautiful.ai(미확인). Genspark/Manus/Alai/Presenton 미비 | [기본] |
| 공유 권한+패스워드+만료 링크 | 다수 | [기본] |
| 방문자 이메일 게이트 | Pitch | [차별화] |
| 워크스페이스/RBAC/SCIM | 다수(Pitch Teamspaces 등) | [기본] |
| 버전 히스토리 | Gamma·Pitch(30일~무제한)·Genspark(Save Points 무료)·Canva | [기본] |
| **조회 애널리틱스**(슬라이드별 체류/이탈) | Gamma(Pro+)·Pitch(방문자 피드)·Presentations.ai(무료 기본)·Decktopus·Alai·Beautiful.ai(미확인) | [신흥표준] |
| **딜룸**(덱+파일+체크리스트+스케줄링+HubSpot) | Pitch Rooms 단독 | [차별화] |
| **슬라이드 내 폼/리드캡처+webhook→CRM** | Decktopus 단독 | [차별화] |
| 슬라이드 담당자 할당+Slack 알림 / 승인 워크플로 | Pitch / Decktopus(Ent) | [차별화] |
| **초대자가 에이전트에 직접 지시(@Manus), 크레딧 오너 부담** | Manus Collab 단독 | [차별화] |
| SSO/SAML/SOC2/감사 로그 | 상위 플랜 공통 | [기본](엔터프라이즈) |

### 9. AI 부가

| 기능 | 보유 제품 | 분류 |
|---|---|---|
| 덱 번역(SlidesAI·Plus AI·Canva 100+ / Gamma 60+ 일괄) | 대부분 | [기본] |
| 요약/확장/축약/톤 리라이트 | 대부분 | [기본] |
| **AI 챗 코파일럿 패널**(덱 문맥) | Gamma·Pitch·Presentations.ai Clip-E·Alai·Presenton·Genspark·Manus | [신흥표준] |
| 덱 논리 비평(proof point 추출, 반론 플래깅) | Pitch Agent·Gamma Agent | [차별화] |
| 예상 청중 질문 생성 | Decktopus | [차별화] |
| 예약/반복 자동 생성(주간 리포트 덱) | Manus(Scheduled Tasks) | [차별화] |
| 브랜드 보이스 | Presentations.ai·Alai | [차별화] |
| **접근성 검사** | **사실상 전 제품 부재 — 시장 공백** | — |
| 인용 문헌 검색(학술) | SlidesAI | [차별화] |

### 10. 플랫폼

| 기능 | 보유 제품 | 분류 |
|---|---|---|
| 프리미엄+크레딧 과금(Gamma $9~18 · Pitch $10~25 · Plus AI $10~200 · Manus $20~200 · Genspark $25~250 · Alai $20~80 · Decktopus $15~) | 지배적 | [기본] |
| **생성 REST API** | Gamma(Pro+)·Presentations.ai(SDK 4종+웹훅+화이트라벨)·Plus AI·Alai(슬라이드 단위)·Presenton(OpenAPI)·Manus. Pitch/Genspark 없음 | [신흥표준] |
| **MCP 서버** | Alai(OAuth2.1+10 tools)·Presenton(빌트인)·Plus AI·Gamma(커넥터) | [신흥표준] |
| Zapier/Make | Gamma·Presentations.ai(9,000+ 앱)·Decktopus | [차별화] |
| 모바일 앱(생성까지) | Gamma(풀기능+리모컨)·Canva. Pitch는 열람 전용 | [차별화] |
| 데스크톱 앱 | Pitch(오프라인)·Presenton(Electron 3-OS)·Manus·Genspark(브라우저) | [차별화] |
| **오픈소스/셀프호스팅/에어갭 + BYOK/로컬 LLM(Ollama)** | Presenton 단독 | [차별화] |
| 호스트 앱 애드온(네이티브 산출) | Plus AI(Slides+PPT+Docs)·SlidesAI | [차별화] |
| 메신저 내 에이전트(Telegram/WhatsApp) | Manus 단독 | [차별화] |

---

## (b) 제품별 카피 가치 높은 고유 기능

| 제품 | 카피 대상 | 왜 |
|---|---|---|
| **Gamma** | Paste 3모드(preserve) · 이미지 모델 멀티 선택+크레딧 차등 · **수동 편집 0크레딧** · Sites(도메인+SEO) · 커넥터 · 폰 리모컨 | 시장 리더($100M ARR)의 검증된 UX |
| **Genspark** | **Guide Mode**(5단계 인터뷰) · **원클릭 팩트체크** · Skills 패키지 · 보이스클론 MP4 · Standard/Ultra 스위치 · 코드 실행 차트 | 고부담 비즈니스 덱 차별화 세트 |
| **Manus** | 리서치→덱 자율 파이프라인+**라이브 활동 로그** · NBP 이미지 요소 편집 유지 · 문맥형 스피커 노트(카테고리 최고평) · Collab · 예약 생성 | 에이전트 UX 최전선. 단 게이트 부재·인용 미표기는 반면교사 |
| **Skywork** | 딥리서치+출처 인용 기본값, 멀티 산출(문서/시트/팟캐스트) (미확인) | "근거 있는 덱"의 표준형 |
| **Canva** | 에셋 규모+이미지 편집 스위트 · Magic Animate · 발표 녹화 · 멀티포맷 (일부 미확인) | 에디터 깊이의 상한선 |
| **Beautiful.ai** | **Smart Slides 적응형 레이아웃**(원조) · 브랜드 잠금 | "디자인이 깨지지 않는다" 보장 |
| **Pitch** | **Rooms(딜룸)** · Batch 50덱 개인화 · 슬라이드별 비디오(다중 테이크) · 방문자 피드 · 로고 22M · 도메인→브랜드 온보딩 | 세일즈 수직 통합 |
| **Plus AI** | 네이티브 애드온(export 마찰 제로) · **Snapshots**(라이브 대시보드+15분 갱신) · 팀 프리셋 · Remix | 기존 워크플로 존중 전략 |
| **Presentations.ai** | Anti-fragile 템플릿 · **Brand Sync**(URL→브랜드) · 라이브 데이터 자동 refresh · 화이트라벨 API | "매주 갱신되는 덱" 반복 수요 |
| **Decktopus** | 폼/리드캡처+webhook→CRM · **AI 프레젠터 코치+Q&A 리허설** · 도메인 호스팅 | 덱=전환 퍼널 관점 |
| **SlidesAI** | 100+ 언어 · 인용 검색. 반면교사: "Coming Soon" 남발의 평판 비용 | 저가+언어 커버리지 |
| **Alai** | **슬라이드당 4변형 제시** · 시맨틱 responsive canvas · 다이어그램 라이브러리 · 콘텐츠 무손실 리디자인 · 디자인 시스템 학습 | 재생성 루프 제거 UX |
| **Presenton** | Apache 2.0 셀프호스트+BYOK 20+ · **템플릿=코드(TSX+Zod)** · PPTX→AI 템플릿 · API-first · Mem0 메모리 | "Gamma를 인프라로" — 우리 구조 차용 1순위 |
| **Tome(사망)** | 기능 아닌 교훈: PPTX 왕복 부재=2,500만 유저로도 사망 | **export 충실도는 생존 조건** |

---

## (c) 패리티 판정

### Must-have (없으면 비교표 탈락) → [PRODUCT_REQUIREMENTS](../00-overview/PRODUCT_REQUIREMENTS.md)에 전량 반영됨

1. 입력: 프롬프트+PDF/DOCX+URL+PPTX 임포트
2. 플로우: 아웃라인 승인+장수/톤/청중+슬라이드별 재생성
3. AI 코파일럿 챗 패널(2026 기준 사실상 기본)
4. 웹 검색 그라운딩+인용
5. 디자인: 테마+브랜드킷+적응형 레이아웃+AI 이미지+스톡+풀 WYSIWYG
6. 차트: 6종+인라인 편집+프롬프트→차트
7. Export: **고충실도 편집 가능 PPTX**+PDF+웹 링크+3비율
8. 발표: 프레젠트 모드+발표자 뷰+AI 스피커 노트
9. 협업: 공동편집+코멘트+권한+버전 히스토리+조회 애널리틱스
10. AI 부가: 번역+요약/톤 리라이트
11. 플랫폼: 크레딧 과금(수동 편집 무료)+PPTX→테마 추출

### Nice-to-have (포지셔닝별 선택 — v2 후보 포함)

- **연구형**: 딥리서치, 원클릭 팩트체크, 코드 실행 차트, 덱 메모리 → **우리 포지셔닝과 일치, P3/P8 반영**
- **세일즈형**: 딜룸, 배치 개인화, 이메일 게이트, 폼/리드캡처, 라이브 데이터 refresh → v2
- **크리에이티브형**: NBP 풀이미지+요소 편집, 멀티포맷 캔버스, 애니메이션 → 일부 P8, 나머지 v2
- **발표 경험**: 보이스클론 MP4, AI 리허설 코치, 폰 리모컨 → v2
- **개발자/기업**: API+웹훅+MCP(신흥표준 — 곧 must 이동 전망, P10), 화이트라벨/셀프호스트 → v2

### 시장 공백 (선점 기회)

1. **슬라이드별 계획 승인 게이트** ⭐우리 핵심 차별화(P4)
2. **컨설팅급 차트**(워터폴/Mekko/CAGR) — P8
3. **접근성 검사** — P10
4. **인용의 구조적 관리**(소스 매니저) — P3 ⭐
5. Excel 라이브 링크가 export까지 살아있는 네이티브 차트 — v2

---

## 출처

gamma.app/pricing · gamma.app/insights/introducing-gamma-3-0 · developers.gamma.app · meetgamma.canny.io/changelog · genspark.ai/docs/ai_slides_changelog · genspark.ai/helpcenter/ai-slides · manus.im/docs/features/slides · manus.im/blog/edit-slides-created-on-manus-with-nano-banana-pro · pitch.com/pricing · pitch.com/whats-new · plusai.com/pricing · guide.plusai.com · presentations.ai/pricing · presentations.ai/solutions/api · decktopus.com/pricing · slidesai.io/pricing · getalai.com/pricing · docs.getalai.com · github.com/presenton/presenton · docs.presenton.ai · deckary.com/blog/tome-review · angellist.com/blog/angellist-x-tome · saastr.com(Lightfield)

**신뢰도 주석**: Skywork/Canva/Beautiful.ai 일부 (미확인). SlidesAI는 마케팅-실기능 갭 큼. 가격은 2026년 중 수차례 개정 — 구현 시 재확인.
