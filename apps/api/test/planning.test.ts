import { describe, expect, it } from 'vitest'
import { ProviderRegistry, PromptStore, type ProviderAdapter } from '@im-ppt/core'
import { MemoryDeckStore, MemoryJobStore, MemorySettingsStore } from '@im-ppt/db'
import type { Deck, Outline } from '@im-ppt/schema'
import { createApp } from '../src/app.js'
import { MemoryStore, type AppDeps, type ExportArtifact } from '../src/deps.js'
import { SettingsService } from '../src/lib/settings-service.js'

/** 스키마 형태로 호출 종류를 구분하는 fake(outline/plan/slide) */
function fakeProvider(): ProviderAdapter {
  return {
    kind: 'claude-cli',
    async generateStructured({ schemaJson }) {
      const props = (schemaJson.properties ?? {}) as Record<string, unknown>
      if ('sections' in props) {
        return {
          data: {
            sections: [
              { title: '기회', summary: '왜 지금', layoutHint: 'bullets', factIds: [] },
              { title: '전략', summary: '어떻게', layoutHint: 'bullets', factIds: [] },
            ],
          },
        }
      }
      if ('designIntent' in props) {
        return { data: { designIntent: '데이터로 설득', contentSummary: '핵심 3가지 정리' } }
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

async function postJson(app: ReturnType<typeof createApp>, path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('HITL 게이트 미리보기', () => {
  it('POST /decks/outline → 아웃라인 초안', async () => {
    const app = createApp(testDeps())
    const res = await postJson(app, '/api/v1/decks/outline', { prompt: 'AI 전략', preset: 'quick' })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { outline: Outline } }
    expect(body.data.outline.sections.length).toBe(2)
    expect(body.data.outline.status).toBe('draft')
  })

  it('POST /decks/plans → 슬라이드별 계획(designIntent+contentSummary)', async () => {
    const app = createApp(testDeps())
    const outline = {
      status: 'draft' as const,
      sections: [
        { id: 'o1', title: 'A', summary: 's', layoutHint: 'bullets', factIds: [] },
        { id: 'o2', title: 'B', summary: 's', layoutHint: 'title', factIds: [] },
      ],
    }
    const res = await postJson(app, '/api/v1/decks/plans', { prompt: 'AI 전략', outline })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: { plans: Array<{ layoutType: string; designIntent: string; contentSummary: string }> }
    }
    expect(body.data.plans).toHaveLength(2)
    expect(body.data.plans[0]!.designIntent).toBe('데이터로 설득')
    expect(body.data.plans[0]!.layoutType).toBe('bullets')
    expect(body.data.plans[1]!.layoutType).toBe('title')
  })

  it('POST /decks — 승인된 아웃라인으로 생성(재생성 없이 그 구조 사용)', async () => {
    const app = createApp(testDeps())
    const outline = {
      status: 'approved' as const,
      sections: [{ id: 'o1', title: '단일', summary: 's', layoutHint: 'bullets', factIds: [] }],
    }
    const res = await postJson(app, '/api/v1/decks', { prompt: 'AI 전략', preset: 'quick', outline })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { data: { deck: Deck } }
    // 승인된 아웃라인이 1섹션이므로 슬라이드도 1장
    expect(body.data.deck.slides).toHaveLength(1)
  })

  it('POST /decks — 승인된 research(팩트/소스)로 인용 적재', async () => {
    const app = createApp(testDeps())
    const research = {
      sources: [{ id: 's1', kind: 'user_text' as const, title: '내 자료' }],
      facts: [{ id: 'f1', sourceId: 's1', kind: 'statistic' as const, statement: '34% 성장', status: 'approved' as const }],
    }
    const outline = {
      status: 'approved' as const,
      sections: [{ id: 'o1', title: '단일', summary: 's', layoutHint: 'bullets', factIds: ['f1'] }],
    }
    const res = await postJson(app, '/api/v1/decks', { prompt: 'AI', preset: 'quick', outline, research })
    const body = (await res.json()) as { data: { deck: Deck } }
    expect(body.data.deck.sources).toHaveLength(1)
    expect(body.data.deck.citations).toHaveLength(1)
    expect(body.data.deck.slides[0]!.citationIds).toEqual(['cite_1'])
  })
})
