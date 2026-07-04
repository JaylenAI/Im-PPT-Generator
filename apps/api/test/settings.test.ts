import { describe, expect, it } from 'vitest'
import { ProviderRegistry, PromptStore, type ProviderAdapter } from '@im-ppt/core'
import { MemoryDeckStore, MemoryJobStore, MemorySettingsStore } from '@im-ppt/db'
import type { Deck } from '@im-ppt/schema'
import { createApp } from '../src/app.js'
import { MemoryStore, type AppDeps, type ExportArtifact } from '../src/deps.js'
import { SettingsService } from '../src/lib/settings-service.js'

function fakeProvider(): ProviderAdapter {
  return {
    kind: 'claude-cli',
    async generateStructured({ schemaJson }) {
      const props = (schemaJson.properties ?? {}) as Record<string, unknown>
      if ('sections' in props) {
        return { data: { sections: [{ title: 'A', summary: 's', layoutHint: 'bullets' }] } }
      }
      return { data: { title: '핵심', bullets: ['하나', '둘'] } }
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

describe('GET /api/v1/settings/catalog (동적 카탈로그)', () => {
  it('앱 필드 서술자 + 현재 값 노출', async () => {
    const res = await createApp(testDeps()).request('/api/v1/settings/catalog')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: { app: { fields: Array<{ key: string }>; values: Record<string, unknown> } }
    }
    expect(body.data.app.fields.length).toBeGreaterThan(0)
    expect(body.data.app.fields.some((f) => f.key === 'defaultLanguage')).toBe(true)
    expect(body.data.app.values.defaultLanguage).toBe('ko')
  })
})

describe('PATCH /api/v1/settings/app (영속 + 검증)', () => {
  it('부분 갱신 후 GET에 반영', async () => {
    const app = createApp(testDeps())
    const patch = await app.request('/api/v1/settings/app', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ defaultLanguage: 'en', defaultSlideCount: 6 }),
    })
    expect(patch.status).toBe(200)
    const get = await app.request('/api/v1/settings/app')
    const body = (await get.json()) as { data: { defaultLanguage: string; defaultSlideCount: number } }
    expect(body.data.defaultLanguage).toBe('en')
    expect(body.data.defaultSlideCount).toBe(6)
  })

  it('잘못된 값은 400', async () => {
    const res = await createApp(testDeps()).request('/api/v1/settings/app', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ defaultSlideCount: 999 }),
    })
    expect(res.status).toBe(400)
  })
})

describe('설정 핫리로드 — 앱 기본값이 다음 생성에 반영', () => {
  it('defaultLanguage 변경 후 생성한 덱이 새 언어', async () => {
    const app = createApp(testDeps())
    await app.request('/api/v1/settings/app', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ defaultLanguage: 'en' }),
    })
    const gen = await app.request('/api/v1/decks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: '핫리로드 검증', preset: 'quick' }),
    })
    const body = (await gen.json()) as { data: { deck: Deck } }
    expect(body.data.deck.language).toBe('en')
  })
})

describe('SettingsService rehydrate (재시작 영속)', () => {
  it('DB(공유 store)에 저장된 앱 설정·프롬프트 오버라이드를 새 인스턴스가 복원', async () => {
    const store = new MemorySettingsStore()
    // 1) 첫 인스턴스 — 설정 변경(= DB 기록)
    const prompts1 = new PromptStore()
    const svc1 = new SettingsService(store, prompts1)
    await svc1.patchApp({ defaultLanguage: 'ja', defaultTone: 'academic' })
    await svc1.setPromptOverride('outline_system', '내 아웃라인 프롬프트')

    // 2) "재시작" — 같은 store로 새 인스턴스 생성 후 hydrate
    const prompts2 = new PromptStore()
    const svc2 = new SettingsService(store, prompts2)
    await svc2.hydrate()

    expect(svc2.getApp().defaultLanguage).toBe('ja')
    expect(svc2.getApp().defaultTone).toBe('academic')
    const outline = prompts2.list().find((p) => p.key === 'outline_system')
    expect(outline?.isOverridden).toBe(true)
    expect(outline?.currentContent).toBe('내 아웃라인 프롬프트')
  })

  it('patchApp은 미지정 필드를 보존한다(기본값 덮어쓰기 없음)', async () => {
    const svc = new SettingsService(new MemorySettingsStore(), new PromptStore())
    await svc.patchApp({ defaultTone: 'casual' })
    await svc.patchApp({ defaultLanguage: 'en' }) // tone 미지정
    expect(svc.getApp().defaultTone).toBe('casual') // 보존
    expect(svc.getApp().defaultLanguage).toBe('en')
  })
})

describe('PATCH /api/v1/settings/prompts/:key (영속)', () => {
  it('오버라이드 저장 후 목록에 반영, 빈 문자열은 기본값 복귀', async () => {
    const app = createApp(testDeps())
    const set = await app.request('/api/v1/settings/prompts/edit_system', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: '커스텀 편집 프롬프트' }),
    })
    const sbody = (await set.json()) as { data: { isOverridden: boolean; currentContent: string } }
    expect(sbody.data.isOverridden).toBe(true)
    expect(sbody.data.currentContent).toBe('커스텀 편집 프롬프트')

    const reset = await app.request('/api/v1/settings/prompts/edit_system', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    })
    const rbody = (await reset.json()) as { data: { isOverridden: boolean } }
    expect(rbody.data.isOverridden).toBe(false)
  })
})
