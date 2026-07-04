import { describe, expect, it, vi } from 'vitest'
import { runResearch, type ResearchDeps, type SearchAdapter, type StructuredLlm } from '../src/index.js'

const llm = (async () => ({
  data: { facts: [{ sourceRef: 1, kind: 'statistic', statement: '추출된 팩트' }] },
})) as unknown as StructuredLlm

function baseDeps(over: Partial<ResearchDeps> = {}): ResearchDeps {
  return { llm, buildFactPrompt: () => 'P', language: 'ko', ...over }
}

describe('runResearch', () => {
  it('off 모드 — 소스/팩트 없음(LLM 미호출)', async () => {
    let called = false
    const spy: StructuredLlm = async (p, s) => {
      called = true
      return llm(p, s)
    }
    const r = await runResearch({ topic: 'X', researchMode: 'off' }, baseDeps({ llm: spy }))
    expect(r.sources).toHaveLength(0)
    expect(r.facts).toHaveLength(0)
    expect(called).toBe(false)
  })

  it('user_only — 유저 텍스트를 소스화하고 팩트 추출', async () => {
    const r = await runResearch(
      { topic: 'X', researchMode: 'user_only', userSources: [{ kind: 'user_text', text: '내 자료', title: '메모' }] },
      baseDeps(),
    )
    expect(r.sources).toHaveLength(1)
    expect(r.sources[0]).toMatchObject({ kind: 'user_text', title: '메모' })
    expect(r.facts).toHaveLength(1)
    expect(r.facts[0]!.sourceId).toBe(r.sources[0]!.id)
  })

  it('user_only는 검색 어댑터를 호출하지 않는다', async () => {
    const search: SearchAdapter = { name: 'fake', search: vi.fn(async () => []) }
    await runResearch(
      { topic: 'X', researchMode: 'user_only', userSources: [{ kind: 'user_text', text: 't' }] },
      baseDeps({ search }),
    )
    expect(search.search).not.toHaveBeenCalled()
  })

  it('web 모드 — 검색 결과를 소스화', async () => {
    const search: SearchAdapter = {
      name: 'fake',
      search: async () => [
        { title: '결과1', url: 'https://r1.com', snippet: '스니펫1' },
        { title: '결과2', url: 'https://r2.com', snippet: '스니펫2' },
      ],
    }
    const r = await runResearch({ topic: 'X', researchMode: 'web' }, baseDeps({ search }))
    expect(r.sources).toHaveLength(2)
    expect(r.sources.every((s) => s.kind === 'web')).toBe(true)
  })

  it('소스가 하나도 없으면 팩트 추출 스킵', async () => {
    let called = false
    const spy: StructuredLlm = async (p, s) => {
      called = true
      return llm(p, s)
    }
    const r = await runResearch({ topic: 'X', researchMode: 'web' }, baseDeps({ llm: spy }))
    // 검색 어댑터 없음 + 유저 소스 없음 → 소스 0
    expect(r.sources).toHaveLength(0)
    expect(called).toBe(false)
  })
})
