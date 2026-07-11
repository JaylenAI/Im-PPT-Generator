import { describe, expect, it } from 'vitest'
import { ProviderRegistry, PromptStore } from '@im-ppt/core'
import { MemoryDeckStore, MemoryJobStore, MemorySettingsStore } from '@im-ppt/db'
import { createApp } from '../src/app.js'
import { MemoryStore, type AppDeps, type ExportArtifact } from '../src/deps.js'
import { SettingsService } from '../src/lib/settings-service.js'
import {
  createPexelsAdapter,
  createUnsplashAdapter,
  isAllowedStockUrl,
  fetchStockAsDataUri,
  type StockImageAdapter,
} from '../src/lib/stock.js'

/** 주입용 가짜 fetch — 지정 JSON을 200으로 반환하고 호출 URL/헤더를 캡처 */
function jsonFetch(payload: unknown, capture?: (url: string, init?: RequestInit) => void): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    capture?.(String(url), init)
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } })
  }) as typeof fetch
}

describe('Pexels 어댑터', () => {
  it('실 응답 형태를 StockPhoto로 파싱하고 키를 헤더에 싣는다', async () => {
    let seenUrl = '', seenAuth = ''
    const fetchImpl = jsonFetch(
      {
        photos: [
          { id: 123, src: { large2x: 'https://images.pexels.com/a-2x.jpg', tiny: 'https://images.pexels.com/a-tiny.jpg' }, alt: '노을', photographer: '홍길동', photographer_url: 'https://pexels.com/@hong' },
          { id: 124, src: { medium: 'https://images.pexels.com/b.jpg' }, photographer: 'Jane' },
        ],
      },
      (u, init) => { seenUrl = u; seenAuth = String((init?.headers as Record<string, string>)?.Authorization ?? '') },
    )
    const ad = createPexelsAdapter({ apiKey: 'KEY123', fetchImpl })
    const photos = await ad.search('sunset', { perPage: 12, orientation: 'landscape' })
    expect(seenUrl).toContain('api.pexels.com/v1/search')
    expect(seenUrl).toContain('query=sunset')
    expect(seenUrl).toContain('orientation=landscape')
    expect(seenAuth).toBe('KEY123')
    expect(photos).toHaveLength(2)
    expect(photos[0]).toMatchObject({ id: 'pexels-123', url: 'https://images.pexels.com/a-2x.jpg', thumbUrl: 'https://images.pexels.com/a-tiny.jpg', alt: '노을', author: '홍길동', provider: 'pexels' })
    expect(photos[1]?.alt).toBe('sunset') // alt 없으면 쿼리로 폴백
  })
})

describe('Unsplash 어댑터', () => {
  it('Client-ID 헤더와 results 파싱', async () => {
    let seenAuth = ''
    const fetchImpl = jsonFetch(
      { results: [{ id: 'xy', urls: { regular: 'https://images.unsplash.com/r.jpg', thumb: 'https://images.unsplash.com/t.jpg' }, alt_description: 'mountain', user: { name: 'Ansel', links: { html: 'https://unsplash.com/@ansel' } } }] },
      (_u, init) => { seenAuth = String((init?.headers as Record<string, string>)?.Authorization ?? '') },
    )
    const ad = createUnsplashAdapter({ apiKey: 'ACCESS', fetchImpl })
    const photos = await ad.search('mountain')
    expect(seenAuth).toBe('Client-ID ACCESS')
    expect(photos[0]).toMatchObject({ id: 'unsplash-xy', url: 'https://images.unsplash.com/r.jpg', author: 'Ansel', provider: 'unsplash' })
  })
})

describe('isAllowedStockUrl — SSRF 방어', () => {
  it('스톡 CDN https만 허용', () => {
    expect(isAllowedStockUrl('https://images.pexels.com/x.jpg')).toBe(true)
    expect(isAllowedStockUrl('https://images.unsplash.com/y.jpg')).toBe(true)
    expect(isAllowedStockUrl('https://plus.unsplash.com/z.jpg')).toBe(true)
    expect(isAllowedStockUrl('http://images.pexels.com/x.jpg')).toBe(false) // http 불가
    expect(isAllowedStockUrl('https://evil.com/x.jpg')).toBe(false)
    expect(isAllowedStockUrl('https://images.pexels.com.evil.com/x.jpg')).toBe(false)
    expect(isAllowedStockUrl('http://169.254.169.254/')).toBe(false)
    expect(isAllowedStockUrl('not-a-url')).toBe(false)
  })
})

describe('fetchStockAsDataUri', () => {
  it('허용 URL의 이미지 바이트를 data URI로', async () => {
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])
    const fetchImpl = (async () =>
      new Response(bytes, { status: 200, headers: { 'content-type': 'image/jpeg' } })) as typeof fetch
    const uri = await fetchStockAsDataUri('https://images.pexels.com/a.jpg', fetchImpl)
    expect(uri.startsWith('data:image/jpeg;base64,')).toBe(true)
    expect(uri).toContain(bytes.toString('base64'))
  })
  it('허용되지 않은 호스트는 거부', async () => {
    await expect(fetchStockAsDataUri('https://evil.com/a.jpg')).rejects.toThrow('허용되지 않은')
  })
})

// ── 라우트 ──
function testDeps(stock?: StockImageAdapter): AppDeps {
  const prompts = new PromptStore()
  return {
    registry: new ProviderRegistry(),
    prompts,
    decks: new MemoryDeckStore(),
    jobs: new MemoryJobStore(),
    settings: new SettingsService(new MemorySettingsStore(), prompts),
    exports: new MemoryStore<ExportArtifact>(),
    ...(stock ? { stockImages: stock } : {}),
  }
}

describe('GET /api/v1/images/stock', () => {
  it('어댑터 없으면 available:false(에디터가 UI 숨김)', async () => {
    const res = await createApp(testDeps()).request('/api/v1/images/stock?q=ocean')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { available: boolean; photos: unknown[] } }
    expect(body.data.available).toBe(false)
    expect(body.data.photos).toEqual([])
  })

  it('q 없으면 400', async () => {
    const res = await createApp(testDeps()).request('/api/v1/images/stock')
    expect(res.status).toBe(400)
  })

  it('어댑터 있으면 사진 반환', async () => {
    const fake: StockImageAdapter = {
      name: 'pexels',
      async search(q) {
        return [{ id: 'pexels-1', url: 'https://images.pexels.com/1.jpg', thumbUrl: 'https://images.pexels.com/t.jpg', alt: q, author: 'A', authorUrl: 'https://pexels.com', provider: 'pexels' }]
      },
    }
    const res = await createApp(testDeps(fake)).request('/api/v1/images/stock?q=ocean')
    const body = (await res.json()) as { data: { available: boolean; provider: string; photos: Array<{ id: string }> } }
    expect(body.data.available).toBe(true)
    expect(body.data.provider).toBe('pexels')
    expect(body.data.photos[0]?.id).toBe('pexels-1')
  })
})

describe('POST /api/v1/images/stock/fetch', () => {
  it('허용되지 않은 URL은 400', async () => {
    const res = await createApp(testDeps()).request('/api/v1/images/stock/fetch', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://evil.com/a.jpg' }),
    })
    expect(res.status).toBe(400)
  })
})
