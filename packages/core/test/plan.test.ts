import { describe, expect, it } from 'vitest'
import { resolveGenerationConfig, slidePlanSchema, type Outline } from '@im-ppt/schema'
import {
  ProviderRegistry,
  PromptStore,
  generatePlans,
  type ModelConnection,
  type ProviderAdapter,
} from '../src/index.js'

const conn: ModelConnection = {
  id: 'c', name: 'c', provider: 'claude-cli', model: 'sonnet',
  tags: ['outline'], params: { adminOnly: false }, isActive: true,
}

function registryWith(data: unknown): ProviderRegistry {
  const fake: ProviderAdapter = { kind: 'claude-cli', generateStructured: async () => ({ data }) }
  return new ProviderRegistry().registerProvider(fake).registerConnection(conn)
}

const cfg = resolveGenerationConfig({ prompt: '주제', preset: 'standard' })
const outline: Outline = {
  status: 'draft',
  sections: [
    { id: 'o1', title: '기회', summary: '왜 지금', layoutHint: 'title', factIds: ['f1'] },
    { id: 'o2', title: '전략', summary: '어떻게', layoutHint: 'bullets', factIds: [] },
  ],
}

describe('generatePlans (슬라이드별 계획 게이트)', () => {
  it('섹션마다 계획 1개 — layoutType/factIds는 섹션 확정, 의도/요약은 LLM', async () => {
    const deps = {
      registry: registryWith({ designIntent: '표지로 임팩트', contentSummary: '핵심 메시지 한 줄' }),
      prompts: new PromptStore(),
    }
    const { plans } = await generatePlans(cfg, outline, deps)
    expect(plans).toHaveLength(2)
    for (const p of plans) expect(slidePlanSchema.safeParse(p).success).toBe(true)
    // layoutType은 섹션 layoutHint에서 확정
    expect(plans[0]!.layoutType).toBe('title')
    expect(plans[1]!.layoutType).toBe('bullets')
    // factIds 전파
    expect(plans[0]!.factIds).toEqual(['f1'])
    expect(plans[1]!.factIds).toEqual([])
    // LLM 산출
    expect(plans[0]!.designIntent).toBe('표지로 임팩트')
    expect(plans[0]!.contentSummary).toBe('핵심 메시지 한 줄')
  })
})
