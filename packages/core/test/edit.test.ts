import { describe, expect, it } from 'vitest'
import type { Deck } from '@im-ppt/schema'
import { slideSchema } from '@im-ppt/schema'
import {
  ProviderRegistry,
  PromptStore,
  editSlide,
  replaceSlide,
  type ModelConnection,
  type ProviderAdapter,
} from '../src/index.js'

const conn: ModelConnection = {
  id: 'c', name: 'c', provider: 'claude-cli', model: 'sonnet',
  tags: ['edit'], params: { adminOnly: false }, isActive: true,
}
function fake(data: unknown): ProviderAdapter {
  return { kind: 'claude-cli', generateStructured: async () => ({ data }) }
}

const deck: Deck = {
  id: 'd1', title: 'T', language: '한국어', aspectRatio: '16:9', themeId: 'stitch-indigo',
  slides: [
    { id: 's1', layoutType: 'bullets', status: 'draft', notes: '', citationIds: [], elements: [
      { id: 'e', type: 'text', role: 'title', content: '기존 제목', frame: { x: 80, y: 70, w: 1120, h: 60 }, rotation: 0, opacity: 1, locked: false, style: {} },
    ] },
    { id: 's2', layoutType: 'title', status: 'draft', notes: '', citationIds: [], elements: [] },
  ],
  sources: [], citations: [], version: 1,
}

describe('editSlide', () => {
  it('선택 슬라이드만 지시에 따라 재생성(레이아웃 유지)', async () => {
    const registry = new ProviderRegistry().registerProvider(fake({ title: '새 제목', bullets: ['가', '나', '다'] })).registerConnection(conn)
    const { slide } = await editSlide({
      deck, slideId: 's1', instruction: '제목을 바꿔줘',
      deps: { registry, prompts: new PromptStore() },
    })
    expect(slide.id).toBe('s1')
    expect(slide.layoutType).toBe('bullets')
    expect(slideSchema.safeParse(slide).success).toBe(true)
    // 콘텐츠가 새로 반영됨
    const hasNewTitle = slide.elements.some((e) => e.type === 'text' && e.content.includes('새 제목'))
    expect(hasNewTitle).toBe(true)
  })

  it('없는 슬라이드는 명확히 실패', async () => {
    const registry = new ProviderRegistry().registerProvider(fake({})).registerConnection(conn)
    await expect(editSlide({ deck, slideId: 'nope', instruction: 'x', deps: { registry, prompts: new PromptStore() } })).rejects.toThrow(/찾을 수 없/)
  })
})

describe('replaceSlide', () => {
  it('한 슬라이드만 교체하고 나머지는 불변, version 증가', () => {
    const edited = { ...deck.slides[0]!, notes: '수정됨' }
    const updated = replaceSlide(deck, edited)
    expect(updated.slides[0]?.notes).toBe('수정됨')
    expect(updated.slides[1]).toBe(deck.slides[1]) // 불변
    expect(updated.version).toBe(deck.version + 1)
  })
})
