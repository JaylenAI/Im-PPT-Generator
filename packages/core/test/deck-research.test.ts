import { describe, expect, it } from 'vitest'
import { resolveGenerationConfig, deckSchema, type Fact, type Source } from '@im-ppt/schema'
import {
  ProviderRegistry,
  PromptStore,
  generateDeck,
  type ModelConnection,
  type ProviderAdapter,
} from '../src/index.js'

const conn: ModelConnection = {
  id: 'c', name: 'c', provider: 'claude-cli', model: 'sonnet',
  tags: ['slide', 'outline', 'research'], params: { adminOnly: false }, isActive: true,
}

function registryWith(data: unknown): ProviderRegistry {
  const fake: ProviderAdapter = { kind: 'claude-cli', generateStructured: async () => ({ data }) }
  return new ProviderRegistry().registerProvider(fake).registerConnection(conn)
}

const cfg = resolveGenerationConfig({ prompt: '재생에너지 전망', preset: 'my_materials', slideCount: 2 })

const sources: Source[] = [{ id: 's1', kind: 'user_text', title: '내 보고서', }]
const facts: Fact[] = [
  { id: 'f1', sourceId: 's1', kind: 'statistic', statement: '태양광 34% 성장', status: 'approved' },
  { id: 'f2', sourceId: 's1', kind: 'insight', statement: '규제 완화 추세', status: 'approved' },
]

describe('generateDeck 인용 전파(리서치 → 팩트 → 인용)', () => {
  it('deck.sources/citations 채우고, factId 배정된 슬라이드에 citationIds 전파', async () => {
    const deps = {
      registry: registryWith({ title: '핵심', bullets: ['하나', '둘'] }),
      prompts: new PromptStore(),
    }
    // 사전 아웃라인 — 섹션1에만 f1 배정
    const outline = {
      status: 'draft' as const,
      sections: [
        { id: 'o1', title: '성장', summary: '수치', layoutHint: 'bullets', factIds: ['f1'] },
        { id: 'o2', title: '전망', summary: '해석', layoutHint: 'bullets', factIds: [] },
      ],
    }
    const { deck } = await generateDeck(cfg, deps, { outline, research: { sources, facts } })

    expect(deckSchema.safeParse(deck).success).toBe(true)
    // 소스/인용 채워짐 — 팩트가 참조한 s1 → cite_1
    expect(deck.sources).toHaveLength(1)
    expect(deck.citations).toEqual([{ id: 'cite_1', sourceId: 's1', label: '1' }])
    // 콘텐츠 2장 + 출처 슬라이드 1장 = 3장
    expect(deck.slides).toHaveLength(3)
    expect(deck.slides[0]!.citationIds).toEqual(['cite_1'])
    expect(deck.slides[1]!.citationIds).toEqual([])
    // 마지막은 자동 출처 슬라이드(references)
    const sourcesSlide = deck.slides[2]!
    expect(sourcesSlide.layoutType).toBe('references')
    expect(sourcesSlide.citationIds).toEqual(['cite_1'])
  })

  it('리서치 없으면 sources/citations 빈 채로 정상 생성(하위호환)', async () => {
    const deps = {
      registry: registryWith({ title: '핵심', bullets: ['하나', '둘'] }),
      prompts: new PromptStore(),
    }
    const outline = {
      status: 'draft' as const,
      sections: [{ id: 'o1', title: 'A', summary: '', layoutHint: 'bullets', factIds: [] }],
    }
    const { deck } = await generateDeck(cfg, deps, { outline })
    expect(deck.sources).toHaveLength(0)
    expect(deck.citations).toHaveLength(0)
    expect(deck.slides[0]!.citationIds).toEqual([])
  })
})
