import { describe, expect, it } from 'vitest'
import type { Outline } from '@im-ppt/schema'
import { checkGhostDeck } from '../src/index.js'

function outline(sections: Array<{ id: string; title: string; assertion?: string }>): Outline {
  return {
    status: 'draft',
    sections: sections.map((s) => ({ ...s, summary: '', layoutHint: 'bullets', factIds: [] })),
  }
}

describe('checkGhostDeck (Titles Test, ADR-009)', () => {
  it('assertion들이 완결 문장이면 통과', () => {
    const r = checkGhostDeck(outline([
      { id: 's1', title: '표지', assertion: '원격근무 생산성은 전략 없이는 떨어진다.' },
      { id: 's2', title: '성장', assertion: '비동기 소통 전환이 이탈률을 절반으로 줄인다.' },
    ]))
    expect(r.coherent).toBe(true)
    expect(r.titles).toHaveLength(2)
    expect(r.titles[0]).toContain('원격근무')
  })

  it('assertion 없으면 missing-assertion 이슈 + title 폴백', () => {
    const r = checkGhostDeck(outline([{ id: 's1', title: '시장 현황' }]))
    expect(r.coherent).toBe(false)
    expect(r.issues[0]!.kind).toBe('missing-assertion')
    expect(r.titles[0]).toBe('시장 현황') // 폴백
  })

  it('라벨(주제어)은 label-not-sentence 이슈', () => {
    const r = checkGhostDeck(outline([{ id: 's1', title: 'x', assertion: '해결 방안' }]))
    expect(r.issues.some((i) => i.kind === 'label-not-sentence')).toBe(true)
  })

  it('중복 제목 감지', () => {
    const r = checkGhostDeck(outline([
      { id: 's1', title: 'a', assertion: '시장은 성장한다.' },
      { id: 's2', title: 'b', assertion: '시장은 성장한다.' },
    ]))
    expect(r.issues.some((i) => i.kind === 'duplicate')).toBe(true)
  })
})
