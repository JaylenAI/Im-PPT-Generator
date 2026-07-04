import { describe, expect, it } from 'vitest'
import { ProviderRegistry, PromptStore, type ProviderAdapter } from '@im-ppt/core'
import { MemoryDeckStore, MemoryJobStore, MemorySettingsStore } from '@im-ppt/db'
import type { Deck, GenerationEvent } from '@im-ppt/schema'
import { createApp } from '../src/app.js'
import { MemoryStore, type AppDeps, type ExportArtifact } from '../src/deps.js'
import { SettingsService } from '../src/lib/settings-service.js'

function fakeProvider(): ProviderAdapter {
  return {
    kind: 'claude-cli',
    async generateStructured({ schemaJson }) {
      const props = (schemaJson.properties ?? {}) as Record<string, unknown>
      if ('sections' in props) {
        return {
          data: {
            sections: [
              { title: '기회', summary: '왜 지금', layoutHint: 'bullets' },
              { title: '전략', summary: '방법', layoutHint: 'bullets' },
            ],
          },
        }
      }
      return { data: { title: '핵심', bullets: ['하나', '둘', '셋'] } }
    },
  }
}

function testDeps(): AppDeps {
  const registry = new ProviderRegistry().registerProvider(fakeProvider()).registerConnection({
    id: 'fake', name: 'fake', provider: 'claude-cli', model: 'sonnet',
    tags: ['outline', 'slide'], params: { adminOnly: false }, isActive: true,
  })
  const prompts = new PromptStore()
  return {
    registry,
    prompts,
    decks: new MemoryDeckStore(),
    jobs: new MemoryJobStore(),
    settings: new SettingsService(new MemorySettingsStore(), prompts),
    exports: new MemoryStore<ExportArtifact>(),
  }
}

/** SSE 응답 본문에서 data 이벤트를 파싱 */
async function readEvents(res: Response): Promise<GenerationEvent[]> {
  const text = await res.text()
  return text
    .split('\n')
    .filter((l) => l.startsWith('data: '))
    .map((l) => JSON.parse(l.slice(6)) as GenerationEvent)
}

describe('POST /api/v1/decks/stream (잡큐 SSE)', () => {
  it('enqueue→워커 처리→이벤트 스트림(job_started…deck_saved)', async () => {
    const app = createApp(testDeps())
    const res = await app.request('/api/v1/decks/stream', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'AI 전략', preset: 'quick' }),
    })
    expect(res.status).toBe(200)
    const events = await readEvents(res)
    const types = events.map((e) => e.type)
    expect(types[0]).toBe('job_started')
    expect(types).toContain('outline_ready')
    expect(types.filter((t) => t === 'slide_done')).toHaveLength(2)
    expect(types).toContain('deck_saved')

    const saved = events.find((e) => e.type === 'deck_saved')
    expect(saved && 'deck' in saved && (saved.deck as Deck).slides).toHaveLength(2)
  })
})

describe('POST /api/v1/decks/generate (detach)', () => {
  it('202로 jobId·deckId 반환하고, 이후 GET /jobs/:id가 done', async () => {
    const deps = testDeps()
    const app = createApp(deps)
    const res = await app.request('/api/v1/decks/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: '수출 전략', preset: 'quick' }),
    })
    expect(res.status).toBe(202)
    const body = (await res.json()) as { data: { jobId: string; deckId: string } }
    expect(body.data.jobId).toMatch(/^job_/)
    expect(body.data.deckId).toMatch(/^deck_/)

    // 워커 kick은 fire-and-forget — 잠깐 대기 후 완료 확인
    await new Promise((r) => setTimeout(r, 100))
    const status = await app.request(`/api/v1/jobs/${body.data.jobId}`)
    expect(status.status).toBe(200)
    const sbody = (await status.json()) as { data: { status: string; deckId: string } }
    expect(sbody.data.status).toBe('done')

    // 덱도 영속 저장됨
    const deck = await app.request(`/api/v1/decks/${body.data.deckId}`)
    expect(deck.status).toBe(200)
  })
})

describe('GET /api/v1/jobs/:id/stream (재접속 재생)', () => {
  it('완료된 잡에 재접속하면 처음부터 이벤트를 재생', async () => {
    const deps = testDeps()
    const app = createApp(deps)
    const gen = await app.request('/api/v1/decks/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: '재접속 테스트', preset: 'quick' }),
    })
    const { data } = (await gen.json()) as { data: { jobId: string } }
    await new Promise((r) => setTimeout(r, 100)) // 완료 대기

    const replay = await app.request(`/api/v1/jobs/${data.jobId}/stream`)
    expect(replay.status).toBe(200)
    const events = await readEvents(replay)
    const types = events.map((e) => e.type)
    expect(types[0]).toBe('job_started')
    expect(types).toContain('deck_saved')
  })

  it('없는 잡은 404', async () => {
    const res = await createApp(testDeps()).request('/api/v1/jobs/nope/stream')
    expect(res.status).toBe(404)
  })
})
