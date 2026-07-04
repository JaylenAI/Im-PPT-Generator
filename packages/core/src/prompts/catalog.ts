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
    variables: ['topic', 'slideCount', 'tone', 'audience', 'language', 'layoutCatalog'],
    content: `당신은 전문 프레젠테이션 기획자입니다. 주제에 대해 논리적이고 설득력 있는 발표 아웃라인을 설계하세요.

주제: {topic}
슬라이드 수: {slideCount}
톤: {tone}
청중: {audience}
언어: {language}

사용 가능한 레이아웃(각 섹션에 가장 적합한 것을 고르세요):
{layoutCatalog}

규칙:
- **정확히 {slideCount}개의 섹션**을 만드세요. 섹션 1개 = 슬라이드 1장입니다.
- 첫 섹션은 title 레이아웃, 마지막은 closing 레이아웃을 권장합니다.
- 각 섹션은 그 슬라이드 하나의 제목(title)과 한 줄 요약(summary), 레이아웃(layoutHint)을 가집니다.
- 전체를 하나의 섹션에 뭉치지 말고, 내용을 {slideCount}개 슬라이드로 나누세요.
- 모든 텍스트는 {language}로 작성합니다.`,
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
- 레이아웃 스키마가 요구하는 필드만 채웁니다.
- 간결하게. 슬라이드는 읽는 문서가 아니라 발표 보조물입니다.
- 수치나 인용은 참고 팩트에 있는 것만 사용하고 지어내지 마세요.
- 모든 텍스트는 {language}로 작성합니다.`,
  },
  slide_plan_system: {
    description: '슬라이드 생성 전 디자인 계획(의도+내용 요약) 보고 — HITL 게이트③',
    category: 'slide',
    variables: ['sectionTitle', 'sectionSummary', 'layoutType'],
    content: `다음 슬라이드를 만들기 전에 어떻게 설계할지 한국어로 간결히 보고하세요.

제목: {sectionTitle}
요약: {sectionSummary}
레이아웃: {layoutType}

designIntent(디자인 의도)와 contentSummary(담을 내용)를 각각 1~2문장으로 작성하세요.`,
  },
  edit_system: {
    description: '선택된 슬라이드를 사용자 지시에 따라 수정(페이지 단위 AI 수정)',
    category: 'edit',
    variables: ['instruction', 'layoutType', 'currentContent', 'language'],
    content: `사용자의 지시에 따라 이 슬라이드 하나만 수정하세요.

지시: {instruction}
레이아웃: {layoutType}
현재 내용: {currentContent}
언어: {language}

규칙:
- 지시에 관련된 부분만 바꾸고 나머지는 유지합니다.
- 레이아웃 스키마가 요구하는 필드 형태를 유지합니다.`,
  },
} as const satisfies Record<string, PromptDef>

export type PromptKey = keyof typeof PROMPT_CATALOG
