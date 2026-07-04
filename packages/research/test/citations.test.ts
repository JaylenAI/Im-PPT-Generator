import { describe, expect, it } from 'vitest'
import type { Fact, Source } from '@im-ppt/schema'
import { buildCitations, citationIdsForFacts } from '../src/index.js'

const sources: Source[] = [
  { id: 's1', kind: 'web', title: 'A', url: 'https://a.com' },
  { id: 's2', kind: 'user_text', title: 'B' },
  { id: 's3', kind: 'web', title: 'C', url: 'https://c.com' },
]
const facts: Fact[] = [
  { id: 'f1', sourceId: 's1', kind: 'statistic', statement: '통계1', status: 'approved' },
  { id: 'f2', sourceId: 's1', kind: 'insight', statement: '통찰1', status: 'approved' },
  { id: 'f3', sourceId: 's2', kind: 'quote', statement: '인용1', status: 'approved' },
]

describe('buildCitations', () => {
  it('참조된 소스마다 번호 붙은 인용 1개(미참조 소스는 제외)', () => {
    const { citations, sourceToCitation } = buildCitations(sources, facts)
    // s1, s2만 팩트에 참조됨 → 인용 2개. s3는 없음
    expect(citations).toHaveLength(2)
    expect(citations[0]).toMatchObject({ label: '1', sourceId: 's1', url: 'https://a.com' })
    expect(citations[1]).toMatchObject({ label: '2', sourceId: 's2' })
    expect(citations[1]!.url).toBeUndefined() // user_text는 url 없음
    expect(sourceToCitation).toEqual({ s1: 'cite_1', s2: 'cite_2' })
  })

  it('팩트 없으면 인용 없음', () => {
    expect(buildCitations(sources, []).citations).toHaveLength(0)
  })
})

describe('citationIdsForFacts', () => {
  it('팩트들의 소스 인용 ID(중복 제거)', () => {
    const { sourceToCitation } = buildCitations(sources, facts)
    // f1,f2는 s1(cite_1), f3는 s2(cite_2)
    expect(citationIdsForFacts(facts, sourceToCitation)).toEqual(['cite_1', 'cite_2'])
    expect(citationIdsForFacts([facts[0]!, facts[1]!], sourceToCitation)).toEqual(['cite_1'])
  })
})
