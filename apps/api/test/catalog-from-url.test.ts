import { vi, describe, expect, it } from 'vitest'
import { ProviderRegistry, PromptStore } from '@im-ppt/core'
import { MemoryDeckStore, MemoryJobStore, MemorySettingsStore } from '@im-ppt/db'
import type { BrandKit, CustomTemplate } from '@im-ppt/schema'
import { createApp } from '../src/app.js'
import { MemoryStore, type AppDeps, type ExportArtifact } from '../src/deps.js'
import { SettingsService } from '../src/lib/settings-service.js'

// url-extract 네트워크 계층을 mock — 라우트 배선(이름 도출/조립/영속/응답)만 검증.
// 실 SSRF 거부·추출 정확도는 url-extract.test.ts가 단위로 커버.
const { extractMock } = vi.hoisted(() => ({ extractMock: vi.fn<(url: string) => Promise<BrandKit>>() }))
vi.mock('../src/lib/url-extract.js', () => ({ extractUrlBrandKit: extractMock }))

function testDeps(): AppDeps {
  const registry = new ProviderRegistry()
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

function post(app: ReturnType<typeof createApp>, body: unknown) {
  return app.request('/api/v1/templates/from-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/v1/templates/from-url (P12 브랜드 매칭)', () => {
  it('url 없으면 400 VALIDATION_FAILED', async () => {
    const res = await post(createApp(testDeps()), {})
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('VALIDATION_FAILED')
  })

  it('추출 성공 시 커스텀 템플릿 생성·영속(201)', async () => {
    extractMock.mockResolvedValueOnce({
      colors: { primary: '#123456', accent: '#abcdef', background: '#ffffff' },
      fonts: { heading: 'Brandon', body: 'Georgia' },
    })
    const app = createApp(testDeps())
    const res = await post(app, { url: 'https://acme.com/home' })
    expect(res.status).toBe(201)
    const { data } = (await res.json()) as { data: CustomTemplate }
    expect(data.source).toBe('imported_url')
    expect(data.name).toBe('acme.com') // www 제거·호스트 도출
    expect(data.sourceFileRef).toBe('https://acme.com/home')
    expect(data.themeTokens.colors.primary).toBe('#123456')
    expect(data.themeTokens.colors.accent).toBe('#abcdef')
    expect(data.themeTokens.fonts.heading).toBe('Brandon')

    // 카탈로그에 노출(내 템플릿이 앞에)
    const list = await app.request('/api/v1/templates')
    const { data: templates } = (await list.json()) as { data: CustomTemplate[] }
    expect(templates[0]?.id).toBe(data.id)
    expect(templates[0]?.source).toBe('imported_url')
  })

  it('name 지정 시 우선, www 접두 제거', async () => {
    extractMock.mockResolvedValueOnce({ colors: { primary: '#0a0a0a' } })
    const res = await post(createApp(testDeps()), { url: 'https://www.brand.io', name: '우리 브랜드' })
    expect(res.status).toBe(201)
    const { data } = (await res.json()) as { data: CustomTemplate }
    expect(data.name).toBe('우리 브랜드')
  })

  it('추출 실패 시 400 EXTRACT_FAILED', async () => {
    extractMock.mockRejectedValueOnce(new Error('내부 IP는 허용되지 않습니다'))
    const res = await post(createApp(testDeps()), { url: 'http://169.254.169.254' })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: { code: string; message: string } }
    expect(body.error.code).toBe('EXTRACT_FAILED')
    expect(body.error.message).toContain('내부 IP')
  })
})
