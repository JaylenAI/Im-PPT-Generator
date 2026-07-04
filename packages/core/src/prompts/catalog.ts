/**
 * 프롬프트 카탈로그 = 기본값 SSOT (GC-Agent prompts.yaml 미러링).
 * 모든 LLM 프롬프트는 여기에만 있고, 코드에 인라인 프롬프트 금지.
 * 사용자 오버라이드는 PromptStore(loader.ts)가 이 위에 얹는다.
 * 출력 계약(JSON 형태)은 프롬프트가 아니라 코드(zod 스키마)가 강제 → 프롬프트는 지시문만.
 */
export interface PromptDef {
  description: string
  category: 'outline' | 'slide' | 'edit' | 'research' | 'system'
  /** {name} 형태로 치환되는 변수 이름들(문서화/검증용) */
  variables: string[]
  content: string
}

export const PROMPT_CATALOG = {
  outline_system: {
    description: '주제로부터 발표 아웃라인(섹션 목록)을 생성',
    category: 'outline',
    variables: ['topic', 'slideCount', 'tone', 'audience', 'language', 'layoutCatalog', 'facts'],
    content: `당신은 전문 프레젠테이션 기획자입니다. 주제에 대해 논리적이고 설득력 있는 발표 아웃라인을 설계하세요.

주제: {topic}
슬라이드 수: {slideCount}
톤: {tone}
청중: {audience}
언어: {language}

사용 가능한 레이아웃(각 섹션에 가장 적합한 것을 고르세요):
{layoutCatalog}

승인된 리서치 팩트(있으면 관련 팩트 ID를 해당 섹션 factIds에 배정):
{facts}

규칙:
- **정확히 {slideCount}개의 섹션**을 만드세요. 섹션 1개 = 슬라이드 1장입니다.
- 첫 섹션은 title 레이아웃, 마지막은 closing 레이아웃을 권장합니다.
- 각 섹션은 title(짧은 라벨), **assertion(핵심 주장)**, summary(한 줄 요약), layoutHint를 가집니다.
- **assertion = 그 슬라이드의 결론을 담은 완결된 한 문장**(주제 라벨 금지). 이게 슬라이드 헤드라인이 됩니다.
  좋은 예) "국내 시장은 3년째 연 34% 성장 중이다" / "비동기 소통 전환이 이탈률을 절반으로 줄인다"
  나쁜 예) "시장 현황" / "해결 방안"(← 라벨일 뿐, 주장 아님)
- title은 assertion을 요약한 2~5어절 라벨(썸네일용).
- **Ghost Deck 규칙**: assertion들만 순서대로 읽었을 때 전체 논리(상황→핵심→결론)가 자연스럽게 흐르게 하세요.
- 팩트가 있으면 관련된 팩트 ID만 factIds에 넣으세요(없는 ID 지어내기 금지).
- 같은 layoutHint를 3개 이상 연속으로 쓰지 마세요(단조로움 방지).
- 전체를 한 섹션에 뭉치지 말고 {slideCount}장으로 나누고, 모든 텍스트는 {language}로.`,
  },
  fact_extraction: {
    description: '소스 본문에서 발표에 쓸 팩트를 추출(각 팩트에 출처 sourceRef 부착)',
    category: 'research',
    variables: ['topic', 'sourcesText', 'language'],
    content: `당신은 꼼꼼한 리서치 분석가입니다. 아래 소스들에서 발표 주제에 유용한 팩트만 추출하세요.

발표 주제: {topic}
언어: {language}

소스(각 소스는 [S번호]로 표시):
{sourcesText}

규칙:
- 각 팩트는 반드시 특정 소스에서 나와야 합니다. sourceRef에 그 소스의 번호([S3]이면 3)를 넣으세요.
- 소스에 실제로 있는 내용만 추출하세요. 지어내거나 소스에 없는 수치를 만들지 마세요.
- kind: statistic(수치/통계), insight(핵심 통찰), quote(인용문), visual(도표/그림 설명) 중 하나.
- statement는 {language}로, 슬라이드에 인용 가능한 완결된 한 문장으로 작성하세요.
- 주제와 무관하거나 근거가 약한 내용은 제외하세요. 소스당 1~5개가 적당합니다.`,
  },
  slide_system: {
    description: '아웃라인 섹션 + 레이아웃 스키마에 맞는 슬라이드 콘텐츠 생성',
    category: 'slide',
    variables: ['topic', 'sectionTitle', 'sectionSummary', 'layoutType', 'tone', 'language', 'facts'],
    content: `당신은 전문 프레젠테이션 카피라이터입니다. 아래 슬라이드의 콘텐츠를 작성하세요.

전체 주제: {topic}
이 슬라이드 제목: {sectionTitle}
요약: {sectionSummary}
레이아웃: {layoutType}
톤: {tone}
언어: {language}

참고 팩트(있으면 이 근거만 사용, 없으면 일반 지식):
{facts}

규칙:
- 각 필드에는 슬라이드에 **그대로 표시될 최종 문구만** 넣으세요. 청중이 읽을 실제 내용.
- **제목(title/headline 필드)에는 위 "이 슬라이드 제목"을 그대로 쓰세요**(레이아웃 길이 제한이 있으면 의미를 유지한 채 살짝만 줄임). 임의로 다른 제목을 짓지 마세요 — 이 제목이 슬라이드의 핵심 주장입니다.
- **메타 설명·작업 보고·라벨 금지**: "슬라이드 카피 작성 완료", "~작성했습니다", "bullets 레이아웃에 맞춰 구성", "제목:", "요점1:" 같은 문구를 절대 넣지 마세요.
- 선택 필드(note/caption 등)는 실제로 넣을 내용이 없으면 비우세요(억지로 채우지 말 것).
- 좋은 예) title: "핵심 전략 3가지", bullets: ["비동기 소통 체계화", "OKR 기반 성과관리"]
- 나쁜 예) title: "핵심 전략 3가지 — 슬라이드 카피 작성 완료", caption: "bullets 레이아웃에 맞춰 구성"
- 간결하게. 슬라이드는 읽는 문서가 아니라 발표 보조물입니다.
- 수치나 인용은 참고 팩트에 있는 것만 사용하고 지어내지 마세요.
- 모든 텍스트는 {language}로 작성합니다.`,
  },
  slide_plan_system: {
    description: '슬라이드 생성 전 디자인 계획(의도+내용 요약) 보고 — HITL 게이트③',
    category: 'slide',
    variables: ['sectionTitle', 'sectionSummary', 'layoutType', 'facts', 'language'],
    content: `다음 슬라이드를 만들기 전에 어떻게 설계할지 {language}로 간결히 보고하세요.

제목: {sectionTitle}
요약: {sectionSummary}
레이아웃: {layoutType}

참고 팩트(있으면 이 근거를 어떻게 쓸지 반영):
{facts}

designIntent(이 슬라이드를 어떤 의도·구성으로 만들지)와 contentSummary(구체적으로 담을 내용)를
각각 1~2문장으로 작성하세요. 실제 만들 내용을 요약하되, 최종 문구가 아니라 계획을 서술하세요.`,
  },
  translate_system: {
    description: '슬라이드의 텍스트 배열을 대상 언어로 번역(순서·개수 보존)',
    category: 'edit',
    variables: ['targetLanguage', 'texts'],
    content: `다음 프레젠테이션 텍스트들을 {targetLanguage}로 자연스럽게 번역하세요.

번역할 텍스트(순서대로):
{texts}

규칙:
- 입력과 **정확히 같은 개수**의 번역을 같은 순서로 반환하세요.
- 각 항목은 슬라이드에 표시될 최종 문구입니다 — 번역문만, 설명·번호·라벨 금지.
- 고유명사·브랜드명·숫자·단위는 보존하고, 문맥에 맞는 자연스러운 {targetLanguage}로.
- 발표 자료 톤(간결·명료)을 유지하세요.`,
  },
  image_svg_system: {
    description: '개념을 표현하는 SVG 일러스트/그래픽 생성(claude -p 기반, 무키)',
    category: 'edit',
    variables: ['concept', 'width', 'height', 'palette'],
    content: `깔끔하고 현대적인 프레젠테이션용 SVG 벡터 일러스트를 생성하세요.

표현할 개념: {concept}
캔버스: viewBox="0 0 {width} {height}"
사용할 색상 팔레트(가능하면 이 색들로): {palette}

규칙:
- svg 필드에 **완결된 유효한 SVG 마크업만** 반환하세요(<svg ...>...</svg>). 설명·마크다운·코드펜스 금지.
- 반드시 width="{width}" height="{height}" viewBox="0 0 {width} {height}" 속성을 포함하세요.
- 단순 도형(rect/circle/path/line/polygon)과 위 팔레트 색으로 구성. 외부 이미지/폰트/스크립트 참조 금지.
- 텍스트는 최소화(라벨 정도). 배경은 투명 또는 옅은 색.
- 개념을 상징적으로 표현하는 아이콘/다이어그램 스타일(사진 아님).`,
  },
  speaker_notes_system: {
    description: '슬라이드 내용을 바탕으로 발표자 스피커 노트 생성',
    category: 'edit',
    variables: ['topic', 'slideTitle', 'slideContent', 'language'],
    content: `당신은 발표자입니다. 아래 슬라이드를 청중 앞에서 발표할 때 **실제로 말할 대본**을 {language}로 쓰세요.

발표 주제: {topic}
슬라이드 제목: {slideTitle}
슬라이드 내용: {slideContent}

중요:
- notes에는 발표자가 청중에게 **그대로 말할 내용만** 넣으세요. 2~4문장.
- "사용자 요청은", "~작성하는 작업", "코드 변경", "~하겠습니다" 같은 **메타 설명·작업 서술을 절대 넣지 마세요.**
- 좋은 예) "많은 기업이 AI 도입을 서두르지만 전략 없이는 실패합니다. 오늘은 세 가지 핵심 축을 말씀드리겠습니다."
- 나쁜 예) "이 슬라이드의 발표자 노트를 작성하는 작업입니다."
- 청중에게 말하듯 자연스러운 구어체로.`,
  },
  audience_questions_system: {
    description: '덱 내용 기반 예상 청중 질문 생성',
    category: 'edit',
    variables: ['topic', 'outline', 'language'],
    content: `발표 주제 "{topic}"에 대해 청중이 물어볼 만한 예상 질문을 {language}로 만드세요.

발표 목차:
{outline}

규칙:
- 날카롭고 현실적인 질문 5~7개(반론·심화·실행 관련).
- 각 질문은 완결된 한 문장. 답변은 넣지 마세요.
- 발표 내용과 관련된 질문만.`,
  },
  rewrite_system: {
    description: '슬라이드 텍스트 배열을 지시(톤/길이 등)에 맞게 리라이트(순서·개수 보존)',
    category: 'edit',
    variables: ['instruction', 'texts'],
    content: `다음 프레젠테이션 텍스트들을 지시에 맞게 다시 쓰세요.

지시: {instruction}

원본 텍스트(순서대로):
{texts}

규칙:
- 입력과 **정확히 같은 개수**를 같은 순서로 반환하세요.
- 각 항목은 슬라이드에 표시될 최종 문구입니다 — 다시 쓴 문구만, 설명·번호·라벨 금지.
- 의미는 유지하되 지시(예: 더 간결하게 / 더 격식 있게 / 초보자용으로)를 반영하세요.
- 원본과 같은 언어로 작성하세요.`,
  },
  edit_system: {
    description: '선택된 슬라이드를 사용자 지시에 따라 수정(페이지 단위 AI 수정)',
    category: 'edit',
    variables: ['instruction', 'layoutType', 'currentContent', 'language'],
    content: `당신은 프레젠테이션 카피라이터입니다. 아래 슬라이드를 지시에 맞게 다시 작성하세요.

이 슬라이드의 현재 내용:
{currentContent}

수정 지시: {instruction}
레이아웃: {layoutType}
언어: {language}

중요 규칙:
- 각 필드에는 슬라이드에 그대로 표시될 실제 문구만 넣으세요. title에는 슬라이드 제목, bullets에는 각 요점 문장만.
- "제목:", "불릿1:", "~로 변경", "~ 완료", "간결화" 같은 **라벨·변경설명·메타문구는 절대 넣지 마세요.**
- 좋은 예) title: "디지털 마케팅의 3대 채널", bullets: ["검색(SEO/SEM): 구매 의도 높은 고객 포착", "소셜미디어: 브랜드 인지도 확산"]
- 나쁜 예) title: "슬라이드 간결화 완료", bullets: ["제목: ...", "불릿1: ..."]
- 지시와 무관한 내용은 유지하고, 간결하게 {language}로 작성하세요.`,
  },
} as const satisfies Record<string, PromptDef>

export type PromptKey = keyof typeof PROMPT_CATALOG
