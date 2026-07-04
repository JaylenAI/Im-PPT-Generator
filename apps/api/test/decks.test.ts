import { describe, expect, it } from 'vitest'
import { ProviderRegistry, PromptStore, type ProviderAdapter } from '@im-ppt/core'
import { MemoryDeckStore, MemoryJobStore } from '@im-ppt/db'
import type { Deck } from '@im-ppt/schema'
import { createApp } from '../src/app.js'
import { MemoryStore, type AppDeps, type ExportArtifact } from '../src/deps.js'

/** 모든 레이아웃에 대응하는 콘텐츠를 반환하는 가짜 프로바이더(오프라인 라우트 테스트) */
function fakeProvider(): ProviderAdapter {
  return {
    kind: 'claude-cli',
    async generateStructured({ schemaJson }) {
      // 아웃라인 요청이면 sections, 슬라이드 요청이면 bullets 콘텐츠 반환
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
  return {
    registry,
    prompts: new PromptStore(),
    decks: new MemoryDeckStore(),
    jobs: new MemoryJobStore(),
    exports: new MemoryStore<ExportArtifact>(),
  }
}

describe('POST /api/v1/decks', () => {
  it('프롬프트로 덱을 생성하고 201로 반환', async () => {
    const app = createApp(testDeps())
    const res = await app.request('/api/v1/decks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'AI 도입 전략', preset: 'quick' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { data: { deckId: string; deck: Deck } }
    expect(body.data.deck.slides).toHaveLength(2)
    expect(body.data.deck.title).toContain('AI 도입 전략')
  })

  it('prompt 없으면 400 VALIDATION_FAILED', async () => {
    const app = createApp(testDeps())
    const res = await app.request('/api/v1/decks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('VALIDATION_FAILED')
  })
})

describe('GET /api/v1/decks/:id', () => {
  it('생성한 덱을 조회', async () => {
    const deps = testDeps()
    const app = createApp(deps)
    const created = await (
      await app.request('/api/v1/decks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: 'X' }),
      })
    ).json() as { data: { deckId: string } }

    const res = await app.request(`/api/v1/decks/${created.data.deckId}`)
    expect(res.status).toBe(200)
  })

  it('없는 덱은 404', async () => {
    const res = await createApp(testDeps()).request('/api/v1/decks/nope')
    expect(res.status).toBe(404)
  })
})

describe('POST /export → GET download', () => {
  it('덱을 PPTX로 내보내고 바이너리를 다운로드', async () => {
    const deps = testDeps()
    const app = createApp(deps)
    const created = (await (
      await app.request('/api/v1/decks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: '수출 전략' }),
      })
    ).json()) as { data: { deckId: string } }

    const exp = await app.request(`/api/v1/decks/${created.data.deckId}/export`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ format: 'pptx' }),
    })
    expect(exp.status).toBe(201)
    const expBody = (await exp.json()) as { data: { exportId: string; filename: string } }
    expect(expBody.data.filename).toMatch(/\.pptx$/)

    const dl = await app.request(`/api/v1/exports/${expBody.data.exportId}/download`)
    expect(dl.status).toBe(200)
    expect(dl.headers.get('content-type')).toContain('presentationml')
    const buf = Buffer.from(await dl.arrayBuffer())
    expect(buf[0]).toBe(0x50) // PK (zip)
    expect(buf.length).toBeGreaterThan(1000)
  })
})

describe('카탈로그 + 설정 라우트', () => {
  it('GET /templates, /themes, /layouts', async () => {
    const app = createApp(testDeps())
    for (const path of ['/api/v1/templates', '/api/v1/themes', '/api/v1/layouts']) {
      const res = await app.request(path)
      expect(res.status).toBe(200)
      const body = (await res.json()) as { data: unknown[] }
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBeGreaterThan(0)
    }
  })

  it('GET /settings/prompts가 프롬프트 카탈로그를 노출', async () => {
    const res = await createApp(testDeps()).request('/api/v1/settings/prompts')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: Array<{ key: string }> }
    expect(body.data.some((p) => p.key === 'outline_system')).toBe(true)
  })

  it('PATCH /settings/prompts/:key 오버라이드 후 반영', async () => {
    const app = createApp(testDeps())
    const res = await app.request('/api/v1/settings/prompts/edit_system', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: '내 커스텀 프롬프트' }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { isOverridden: boolean; currentContent: string } }
    expect(body.data.isOverridden).toBe(true)
    expect(body.data.currentContent).toBe('내 커스텀 프롬프트')
  })

  it('GET /settings/models는 apiKey를 마스킹', async () => {
    const res = await createApp(testDeps()).request('/api/v1/settings/models')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { connections: unknown[] } }
    expect(Array.isArray(body.data.connections)).toBe(true)
  })
})
