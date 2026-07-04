import { z } from 'zod'
import type { GenerationConfig, Outline } from '@im-ppt/schema'
import { layoutCatalogForLlm } from '@im-ppt/templates'
import type { ProviderRegistry } from '../providers/registry.js'
import type { PromptStore } from '../prompts/loader.js'

/** LLM 출력 계약 — id는 우리가 부여하므로 LLM엔 title/summary/layoutHint만 요구 */
const outlineDraftSchema = z.object({
  sections: z
    .array(
      z.object({
        title: z.string().min(1),
        summary: z.string().default(''),
        layoutHint: z.string().min(1),
      }),
    )
    .min(1),
})

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
): Promise<{ outline: Outline; usage?: { costUsd?: number } }> {
  const validLayouts = new Set(layoutCatalogForLlm().map((l) => l.key))
  const catalogText = layoutCatalogForLlm()
    .map((l) => `- ${l.key}: ${l.description}`)
    .join('\n')

  const prompt = deps.prompts.get('outline_system', {
    topic: config.prompt,
    slideCount: config.slideCount,
    tone: config.tone,
    audience: config.audience || '일반',
    language: config.language,
    layoutCatalog: catalogText,
  })

  const { data, usage } = await deps.registry.generateStructured(
    'outline',
    prompt,
    outlineDraftSchema,
  )

  const sections = data.sections.map((s) => ({
    id: nextId('section'),
    title: s.title,
    summary: s.summary,
    layoutHint: validLayouts.has(s.layoutHint) ? s.layoutHint : 'bullets',
    factIds: [],
  }))

  return {
    outline: { sections, status: 'draft' },
    ...(usage?.costUsd !== undefined ? { usage: { costUsd: usage.costUsd } } : {}),
  }
}
