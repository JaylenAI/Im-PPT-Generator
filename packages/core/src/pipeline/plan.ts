import { z } from 'zod'
import type { Fact, GenerationConfig, Outline, SlidePlan } from '@im-ppt/schema'
import { getLayout } from '@im-ppt/templates'
import type { ProviderRegistry } from '../providers/registry.js'
import type { PromptStore } from '../prompts/loader.js'

/** LLM 출력 계약 — layoutType/factIds는 섹션에서 확정, 의도/요약만 LLM이 작성 */
const planDraftSchema = z.object({
  designIntent: z.string().min(1),
  contentSummary: z.string().min(1),
})

export interface PlanDeps {
  registry: ProviderRegistry
  prompts: PromptStore
}

function factsText(facts: Fact[]): string {
  if (facts.length === 0) return '(참고 팩트 없음)'
  return facts.map((f) => `- [${f.kind}] ${f.statement}`).join('\n')
}

/**
 * 슬라이드별 계획 생성 — 각 아웃라인 섹션에 대해 "무엇을 어떻게 만들지"를 보고(HITL 게이트③).
 * 생성 전 유저가 슬라이드마다 설계 의도+담을 내용을 보고 승인/편집한다(시장 공백 차별화).
 * 섹션 병렬 처리. layoutType/factIds는 섹션에서 확정, designIntent/contentSummary만 LLM.
 */
export async function generatePlans(
  config: GenerationConfig,
  outline: Outline,
  deps: PlanDeps,
  opts: { facts?: Fact[] } = {},
): Promise<{ plans: SlidePlan[]; costUsd: number }> {
  const allFacts = opts.facts ?? []
  const results = await Promise.all(
    outline.sections.map(async (section) => {
      const layout = getLayout(section.layoutHint ?? 'bullets')
      const sectionFacts = allFacts.filter((f) => section.factIds.includes(f.id))
      const prompt = deps.prompts.get('slide_plan_system', {
        sectionTitle: section.title,
        sectionSummary: section.summary,
        layoutType: layout.key,
        facts: factsText(sectionFacts),
        language: config.language,
      })
      const { data, usage } = await deps.registry.generateStructured('outline', prompt, planDraftSchema)
      const plan: SlidePlan = {
        layoutType: layout.key,
        designIntent: data.designIntent,
        contentSummary: data.contentSummary,
        factIds: section.factIds,
      }
      return { plan, costUsd: usage?.costUsd ?? 0 }
    }),
  )
  return {
    plans: results.map((r) => r.plan),
    costUsd: results.reduce((sum, r) => sum + r.costUsd, 0),
  }
}
