import { z } from 'zod'
import type { Fact, GenerationConfig, Outline } from '@im-ppt/schema'
import { getPresentationType, renderScaffold } from '@im-ppt/schema'
import { layoutCatalogForLlm } from '@im-ppt/templates'
import type { ProviderRegistry } from '../providers/registry.js'
import type { PromptStore } from '../prompts/loader.js'
import { alignLayoutsToSequence, layoutSequenceHint } from './sequence.js'

/** LLM 출력 계약 — id는 우리가 부여, factIds는 제공된 팩트 ID를 섹션에 배정 */
const outlineDraftSchema = z.object({
  sections: z
    .array(
      z.object({
        title: z.string().min(1),
        assertion: z.string().default(''),
        summary: z.string().default(''),
        layoutHint: z.string().min(1),
        factIds: z.array(z.string()).default([]),
      }),
    )
    .min(1),
})

function factsText(facts: Fact[]): string {
  if (facts.length === 0) return '(리서치 없음 — 일반 지식으로 설계)'
  return facts.map((f) => `- [${f.id}] (${f.kind}) ${f.statement}`).join('\n')
}

let counter = 0
function nextId(prefix: string): string {
  counter += 1
  return `${prefix}_${counter}`
}

export interface OutlineDeps {
  registry: ProviderRegistry
  prompts: PromptStore
}

/**
 * 아웃라인 생성 — config를 읽어 프롬프트 구성 → claude-cli 구조화 출력 → 우리 스키마로 정규화.
 * layoutHint는 templates 레지스트리의 실제 키로 검증(미등록이면 bullets로 폴백).
 */
export async function generateOutline(
  config: GenerationConfig,
  deps: OutlineDeps,
  opts: { facts?: Fact[]; layoutOrder?: string[] } = {},
): Promise<{ outline: Outline; usage?: { costUsd?: number } }> {
  const facts = opts.facts ?? []
  const validLayouts = new Set(layoutCatalogForLlm().map((l) => l.key))
  const validFactIds = new Set(facts.map((f) => f.id))
  const catalogText = layoutCatalogForLlm()
    .map((l) => `- ${l.key}: ${l.description}`)
    .join('\n')

  // 발표 유형 스캐폴드 — general이면 표준 골격, 특정 유형이면 그 장르의 서사 구조 주입.
  // 템플릿에 설계된 레이아웃 흐름(layoutOrder)이 있으면 골격 뒤에 덧붙여 함께 가이드.
  const ptype = getPresentationType(config.presentationType)
  const scaffold = renderScaffold(ptype) + layoutSequenceHint(opts.layoutOrder)

  const prompt = deps.prompts.get('outline_system', {
    topic: config.prompt,
    slideCount: config.slideCount,
    tone: config.tone,
    audience: config.audience || '일반',
    language: config.language,
    layoutCatalog: catalogText,
    facts: factsText(facts),
    scaffold,
  })

  const { data, usage } = await deps.registry.generateStructured(
    'outline',
    prompt,
    outlineDraftSchema,
  )

  const drafted = data.sections.map((s) => ({
    id: nextId('section'),
    title: s.title,
    assertion: s.assertion,
    summary: s.summary,
    layoutHint: s.layoutHint,
    // 지어낸 팩트 ID 폐기 — 제공된 것만 유지(할루시네이션 제로)
    factIds: s.factIds.filter((id) => validFactIds.has(id)),
  }))

  // 템플릿 시퀀스 정렬(콘텐츠-안전) → 유효 레이아웃으로 clamp(잘못된 키는 bullets)
  const aligned = alignLayoutsToSequence(drafted, opts.layoutOrder)
  const sections = aligned.map((s) => ({
    ...s,
    layoutHint: validLayouts.has(s.layoutHint) ? s.layoutHint : 'bullets',
  }))

  return {
    outline: { sections, status: 'draft' },
    ...(usage?.costUsd !== undefined ? { usage: { costUsd: usage.costUsd } } : {}),
  }
}
