import { describe, expect, it } from 'vitest'
import type { Deck } from '@im-ppt/schema'
import {
  ProviderRegistry,
  PromptStore,
  translateDeck,
  type ModelConnection,
  type ProviderAdapter,
} from '../src/index.js'

const conn: ModelConnection = {
  id: 'c', name: 'c', provider: 'claude-cli', model: 'sonnet',
  tags: ['edit'], params: { adminOnly: false }, isActive: true,
}

function registryWith(data: unknown): ProviderRegistry {
  const fake: ProviderAdapter = { kind: 'claude-cli', generateStructured: async () => ({ data }) }
  return new ProviderRegistry().registerProvider(fake).registerConnection(conn)
}

function deck(): Deck {
  return {
    id: 'd1', title: 'T', language: 'ko', aspectRatio: '16:9', themeId: 'stitch-indigo',
    slides: [{
      id: 's1', layoutType: 'bullets', notes: '', citationIds: [], status: 'draft',
      elements: [
        { id: 't1', type: 'text', role: 'title', content: '안녕하세요', frame: { x: 1, y: 2, w: 3, h: 4 }, rotation: 0, opacity: 1, locked: false, style: {} },
        { id: 'l1', type: 'list', items: ['첫째', '둘째'], marker: 'dot', frame: { x: 5, y: 6, w: 7, h: 8 }, rotation: 0, opacity: 1, locked: false, style: {} },
      ],
    }],
    sources: [], citations: [], version: 3,
  }
}

describe('translateDeck', () => {
  it('텍스트/리스트를 순서대로 번역 교체, 레이아웃·좌표 불변, 언어/새 ID', async () => {
    // 3개 텍스트(title + list 2항목) → 3개 번역
    const deps = { registry: registryWith({ translations: ['Hello', 'First', 'Second'] }), prompts: new PromptStore() }
    const out = await translateDeck(deck(), 'en', deps)

    expect(out.language).toBe('en')
    expect(out.id).not.toBe('d1') // 새 덱(원본 보존)
    const el = out.slides[0]!.elements
    expect(el[0]).toMatchObject({ type: 'text', content: 'Hello', frame: { x: 1, y: 2, w: 3, h: 4 } })
    expect(el[1]).toMatchObject({ type: 'list', items: ['First', 'Second'], frame: { x: 5, y: 6, w: 7, h: 8 } })
  })

  it('번역 개수 불일치 시 원문 유지(안전)', async () => {
    const deps = { registry: registryWith({ translations: ['오직 하나'] }), prompts: new PromptStore() } // 3개 필요한데 1개
    const out = await translateDeck(deck(), 'en', deps)
    const el = out.slides[0]!.elements
    expect(el[0]).toMatchObject({ content: '안녕하세요' }) // 원문 유지
  })
})
