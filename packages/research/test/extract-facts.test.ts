import { describe, expect, it } from 'vitest'
import { extractFacts, type SourceDoc, type StructuredLlm } from '../src/index.js'

const docs: SourceDoc[] = [
  { source: { id: 's1', kind: 'web', title: 'A', url: 'https://a.com' }, text: '본문 A' },
  { source: { id: 's2', kind: 'user_text', title: 'B' }, text: '본문 B' },
]

const opts = {
  topic: '주제',
  language: 'ko',
  buildFactPrompt: () => 'PROMPT',
}

/** 고정 응답 fake — 제네릭 StructuredLlm에 캐스트로 맞춘다(스키마 무시) */
function fakeLlm(data: unknown, onCall?: () => void): StructuredLlm {
  return (async () => {
    onCall?.()
    return { data }
  }) as unknown as StructuredLlm
}

describe('extractFacts', () => {
  it('sourceRef를 sourceId로 매핑하고 pending으로 생성', async () => {
    const llm = fakeLlm({
      facts: [
        { sourceRef: 1, kind: 'statistic', statement: '팩트1' },
        { sourceRef: 2, kind: 'quote', statement: '팩트2' },
      ],
    })
    const facts = await extractFacts(docs, { ...opts, llm })
    expect(facts).toHaveLength(2)
    expect(facts[0]).toMatchObject({ sourceId: 's1', kind: 'statistic', statement: '팩트1', status: 'pending' })
    expect(facts[1]).toMatchObject({ sourceId: 's2', kind: 'quote', status: 'pending' })
  })

  it('알 수 없는 sourceRef(지어낸 출처)는 폐기', async () => {
    const llm = fakeLlm({ facts: [{ sourceRef: 99, kind: 'insight', statement: '지어냄' }] })
    expect(await extractFacts(docs, { ...opts, llm })).toHaveLength(0)
  })

  it('소스 없으면 LLM 호출 없이 빈 배열', async () => {
    let called = false
    const llm = fakeLlm({ facts: [] }, () => {
      called = true
    })
    expect(await extractFacts([], { ...opts, llm })).toHaveLength(0)
    expect(called).toBe(false)
  })
})
