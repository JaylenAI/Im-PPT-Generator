import { describe, expect, it } from 'vitest'
import type { Deck } from '@im-ppt/schema'
import {
  ProviderRegistry,
  PromptStore,
  generateSpeakerNotes,
  generateAudienceQuestions,
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
    id: 'd1', title: 'AI 전략', language: 'ko', aspectRatio: '16:9', themeId: 'stitch-indigo',
    slides: [
      { id: 's1', layoutType: 'title', notes: '', citationIds: [], status: 'draft', elements: [
        { id: 't', type: 'text', role: 'title', content: '표지', frame: { x: 0, y: 0, w: 100, h: 20 }, rotation: 0, opacity: 1, locked: false, style: {} },
      ] },
    ],
    sources: [], citations: [], version: 1,
  }
}

describe('generateSpeakerNotes', () => {
  it('정상 노트는 채운다', async () => {
    const deps = { registry: registryWith({ notes: '안녕하세요, 오늘 발표를 시작합니다.' }), prompts: new PromptStore() }
    const out = await generateSpeakerNotes(deck(), deps)
    expect(out.slides[0]!.notes).toBe('안녕하세요, 오늘 발표를 시작합니다.')
  })

  it('메타 설명 누출은 폐기(원본 노트 유지)', async () => {
    const deps = { registry: registryWith({ notes: '발표자 노트를 작성하는 작업입니다. 코드 변경 없음.' }), prompts: new PromptStore() }
    const out = await generateSpeakerNotes(deck(), deps)
    expect(out.slides[0]!.notes).toBe('') // 폐기됨
  })
})

describe('generateAudienceQuestions', () => {
  it('질문 배열 반환', async () => {
    const deps = { registry: registryWith({ questions: ['질문1?', '질문2?'] }), prompts: new PromptStore() }
    expect(await generateAudienceQuestions(deck(), deps)).toEqual(['질문1?', '질문2?'])
  })
})
