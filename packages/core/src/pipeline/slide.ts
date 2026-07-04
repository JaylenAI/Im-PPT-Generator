import type { Fact, GenerationConfig, OutlineSection, Slide } from '@im-ppt/schema'
import { CANVAS_SIZES } from '@im-ppt/schema'
import { getLayout } from '@im-ppt/templates'
import type { ProviderRegistry } from '../providers/registry.js'
import type { PromptStore } from '../prompts/loader.js'

export interface SlideDeps {
  registry: ProviderRegistry
  prompts: PromptStore
}

let slideCounter = 0
function nextSlideId(): string {
  slideCounter += 1
  return `slide_${slideCounter}`
}

function factsText(facts: Fact[]): string {
  if (facts.length === 0) return '(제공된 팩트 없음 — 일반 지식 사용)'
  return facts.map((f) => `- [${f.kind}] ${f.statement}`).join('\n')
}

/**
 * 슬라이드 1장 생성 — 섹션의 레이아웃 스키마를 LLM 출력 계약으로 사용(레이아웃=코드, AI는 채움만).
 * LLM이 레이아웃 contentSchema에 맞는 콘텐츠를 생성 → 레이아웃 build가 절대좌표 요소로 조립.
 */
export async function generateSlide(params: {
  config: GenerationConfig
  section: OutlineSection
  deps: SlideDeps
  facts?: Fact[]
}): Promise<{ slide: Slide; usage?: { costUsd?: number } }> {
  const { config, section, deps } = params
  const facts = params.facts ?? []
  const layout = getLayout(section.layoutHint ?? 'bullets')
  const canvas = CANVAS_SIZES[config.aspectRatio]

  const prompt = deps.prompts.get('slide_system', {
    topic: config.prompt,
    sectionTitle: section.title,
    sectionSummary: section.summary,
    layoutType: layout.key,
    tone: config.tone,
    language: config.language,
    facts: factsText(facts),
  })

  const { data, usage } = await deps.registry.generateStructured(
    'slide',
    prompt,
    layout.contentSchema,
  )

  const { background, elements } = layout.build(data, { canvas })

  const slide: Slide = {
    id: nextSlideId(),
    layoutType: layout.key,
    elements,
    notes: '',
    citationIds: facts.map((f) => f.id),
    status: 'draft',
    ...(background ? { background } : {}),
  }
  return {
    slide,
    ...(usage?.costUsd !== undefined ? { usage: { costUsd: usage.costUsd } } : {}),
  }
}
