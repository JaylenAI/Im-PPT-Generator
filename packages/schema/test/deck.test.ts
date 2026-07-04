import { describe, expect, it } from 'vitest'
import { deckSchema } from '../src/index.js'

const validDeck = {
  id: 'deck_1',
  title: 'AI 시장 분석',
  themeId: 'theme_indigo',
  slides: [
    {
      id: 'slide_1',
      layoutType: 'title',
      elements: [
        {
          id: 'el_1',
          type: 'text',
          role: 'display',
          content: 'AI 시장 분석 2026',
          frame: { x: 80, y: 240, w: 1120, h: 160 },
        },
      ],
      citationIds: ['cit_1'],
    },
  ],
  sources: [
    {
      id: 'src_1',
      kind: 'web',
      title: 'McKinsey AI Report',
      url: 'https://example.com/report',
    },
  ],
  citations: [{ id: 'cit_1', sourceId: 'src_1', label: 'McKinsey Report 2026' }],
}

describe('deckSchema', () => {
  it('유효한 덱을 파싱하고 기본값을 채운다', () => {
    const deck = deckSchema.parse(validDeck)
    expect(deck.language).toBe('ko')
    expect(deck.aspectRatio).toBe('16:9')
    expect(deck.version).toBe(1)
    expect(deck.slides[0]?.status).toBe('planned')
    expect(deck.slides[0]?.elements[0]?.opacity).toBe(1)
  })

  it('지원하지 않는 aspectRatio를 거부한다', () => {
    const result = deckSchema.safeParse({ ...validDeck, aspectRatio: '21:9' })
    expect(result.success).toBe(false)
  })

  it('알 수 없는 요소 type을 거부한다', () => {
    const broken = {
      ...validDeck,
      slides: [
        {
          id: 's',
          layoutType: 'title',
          elements: [{ id: 'e', type: 'video', frame: { x: 0, y: 0, w: 10, h: 10 } }],
        },
      ],
    }
    expect(deckSchema.safeParse(broken).success).toBe(false)
  })

  it('제목 없는 덱을 거부한다', () => {
    expect(deckSchema.safeParse({ ...validDeck, title: '' }).success).toBe(false)
  })
})
