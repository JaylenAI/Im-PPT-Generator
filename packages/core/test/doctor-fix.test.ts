import { describe, expect, it } from 'vitest'
import type { Deck } from '@im-ppt/schema'
import {
  ProviderRegistry,
  PromptStore,
  autoFixDeck,
  diagnoseDeck,
  type ModelConnection,
  type ProviderAdapter,
} from '../src/index.js'

const conn: ModelConnection = {
  id: 'c', name: 'c', provider: 'claude-cli', model: 'sonnet',
  tags: ['edit'], params: { adminOnly: false }, isActive: true,
}
// 항상 규칙 준수(간결한 3글머리) 콘텐츠를 반환하는 fake
function fake(data: unknown): ProviderAdapter {
  return { kind: 'claude-cli', generateStructured: async () => ({ data }) }
}

/** 글머리 8개(과다)인 bullets 슬라이드를 가진 덱 */
function badDeck(): Deck {
  return {
    id: 'd1', title: 'T', language: '한국어', aspectRatio: '16:9', themeId: 'stitch-indigo',
    slides: [
      {
        id: 's1', layoutType: 'bullets', status: 'draft', notes: '', citationIds: [],
        elements: [
          { id: 't', type: 'text', role: 'title', content: '요약', frame: { x: 80, y: 70, w: 1120, h: 60 }, rotation: 0, opacity: 1, locked: false, style: {} },
          { id: 'l', type: 'list', marker: 'dot', style: {}, frame: { x: 80, y: 160, w: 1120, h: 400 }, rotation: 0, opacity: 1, locked: false,
            items: ['1', '2', '3', '4', '5', '6', '7', '8'] },
        ],
      },
    ],
    sources: [], citations: [], version: 1,
  }
}

describe('autoFixDeck (Deck Doctor 자동 수정)', () => {
  it('진단 이슈를 editSlide로 개선해 점수를 높인다', async () => {
    const deck = badDeck()
    const before = diagnoseDeck(deck)
    expect(before.issues.some((i) => i.kind === 'bullet-overload')).toBe(true)

    const registry = new ProviderRegistry()
      .registerProvider(fake({ title: '요약', bullets: ['핵심 하나', '핵심 둘', '핵심 셋'] }))
      .registerConnection(conn)

    const r = await autoFixDeck(deck, { registry, prompts: new PromptStore() })
    expect(r.fixedSlides).toBe(1)
    expect(r.after.score).toBeGreaterThan(r.before.score)
    // 글머리 과다가 해소됨
    expect(r.after.issues.some((i) => i.kind === 'bullet-overload')).toBe(false)
  })

  it('건강한 덱은 수정하지 않는다(fixedSlides 0)', async () => {
    const deck: Deck = {
      id: 'd2', title: 'T', language: '한국어', aspectRatio: '16:9', themeId: 'stitch-indigo',
      slides: [{ id: 's', layoutType: 'closing', status: 'draft', notes: '', citationIds: [],
        elements: [{ id: 't', type: 'text', role: 'title', content: '감사합니다', frame: { x: 80, y: 300, w: 1120, h: 80 }, rotation: 0, opacity: 1, locked: false, style: {} }] }],
      sources: [], citations: [], version: 1,
    }
    const registry = new ProviderRegistry().registerProvider(fake({})).registerConnection(conn)
    const r = await autoFixDeck(deck, { registry, prompts: new PromptStore() })
    expect(r.fixedSlides).toBe(0)
    expect(r.after.score).toBe(100)
  })
})
