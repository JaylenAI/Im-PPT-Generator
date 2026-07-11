/**
 * 스톡 이미지 어댑터(P12) — Pexels/Unsplash에서 실사진을 검색해 편집기 피커로 삽입한다.
 * 검색 어댑터(Tavily/Serper)와 동일한 포트 패턴: 키·fetch 주입으로 테스트 가능,
 * 키 없으면 배선 안 됨(deps.stockImages undefined) → 피커가 "키 미설정" 안내(레이아웃 폴백 유지).
 */

export interface StockPhoto {
  id: string
  /** 원본(고해상) 이미지 URL — 삽입/임베드용 */
  url: string
  /** 썸네일 URL — 피커 그리드용 */
  thumbUrl: string
  alt: string
  author: string
  authorUrl: string
  provider: 'pexels' | 'unsplash'
}

export interface StockSearchOpts {
  perPage?: number
  orientation?: 'landscape' | 'portrait' | 'square'
}

export interface StockImageAdapter {
  name: string
  search(query: string, opts?: StockSearchOpts): Promise<StockPhoto[]>
}

interface AdapterOpts {
  apiKey: string
  fetchImpl?: typeof fetch
}

const TIMEOUT_MS = 8000

async function getJson(url: string, headers: Record<string, string>, fetchImpl: typeof fetch): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetchImpl(url, { headers, signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

/** Pexels — https://api.pexels.com/v1/search, 헤더 Authorization: <key> */
export function createPexelsAdapter(opts: AdapterOpts): StockImageAdapter {
  const fetchImpl = opts.fetchImpl ?? fetch
  return {
    name: 'pexels',
    async search(query, searchOpts) {
      const params = new URLSearchParams({
        query,
        per_page: String(searchOpts?.perPage ?? 12),
      })
      if (searchOpts?.orientation) params.set('orientation', searchOpts.orientation)
      const body = (await getJson(
        `https://api.pexels.com/v1/search?${params.toString()}`,
        { Authorization: opts.apiKey },
        fetchImpl,
      )) as {
        photos?: Array<{
          id: number
          src?: { large2x?: string; large?: string; medium?: string; tiny?: string }
          alt?: string
          photographer?: string
          photographer_url?: string
        }>
      }
      return (body.photos ?? []).map((p) => ({
        id: `pexels-${p.id}`,
        url: p.src?.large2x ?? p.src?.large ?? p.src?.medium ?? '',
        thumbUrl: p.src?.tiny ?? p.src?.medium ?? p.src?.large ?? '',
        alt: p.alt?.trim() || query,
        author: p.photographer ?? 'Pexels',
        authorUrl: p.photographer_url ?? 'https://pexels.com',
        provider: 'pexels' as const,
      })).filter((p) => p.url)
    },
  }
}

/** Unsplash — https://api.unsplash.com/search/photos, 헤더 Authorization: Client-ID <key> */
export function createUnsplashAdapter(opts: AdapterOpts): StockImageAdapter {
  const fetchImpl = opts.fetchImpl ?? fetch
  return {
    name: 'unsplash',
    async search(query, searchOpts) {
      const params = new URLSearchParams({
        query,
        per_page: String(searchOpts?.perPage ?? 12),
      })
      if (searchOpts?.orientation) params.set('orientation', searchOpts.orientation)
      const body = (await getJson(
        `https://api.unsplash.com/search/photos?${params.toString()}`,
        { Authorization: `Client-ID ${opts.apiKey}` },
        fetchImpl,
      )) as {
        results?: Array<{
          id: string
          urls?: { regular?: string; small?: string; thumb?: string }
          alt_description?: string | null
          user?: { name?: string; links?: { html?: string } }
        }>
      }
      return (body.results ?? []).map((r) => ({
        id: `unsplash-${r.id}`,
        url: r.urls?.regular ?? r.urls?.small ?? '',
        thumbUrl: r.urls?.thumb ?? r.urls?.small ?? '',
        alt: r.alt_description?.trim() || query,
        author: r.user?.name ?? 'Unsplash',
        authorUrl: r.user?.links?.html ?? 'https://unsplash.com',
        provider: 'unsplash' as const,
      })).filter((p) => p.url)
    },
  }
}

// ── 이미지 다운로드 → data URI(충실한 PPTX/PDF 임베드용) ──
const ALLOWED_IMAGE_HOSTS = [
  'images.pexels.com', 'images.unsplash.com', 'plus.unsplash.com',
]
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

/** 스톡 CDN 호스트만 허용(SSRF 방어) — URL은 어댑터 응답에서 온 신뢰 값이지만 이중 방어 */
export function isAllowedStockUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

/** 허용된 스톡 URL을 받아 data URI로 변환. exporter/renderer가 그대로 임베드 */
export async function fetchStockAsDataUri(url: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  if (!isAllowedStockUrl(url)) throw new Error('허용되지 않은 이미지 URL')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetchImpl(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`이미지 다운로드 실패(HTTP ${res.status})`)
    const type = res.headers.get('content-type') ?? 'image/jpeg'
    if (!type.startsWith('image/')) throw new Error('이미지가 아닙니다')
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > MAX_IMAGE_BYTES) throw new Error('이미지가 너무 큽니다')
    return `data:${type};base64,${buf.toString('base64')}`
  } finally {
    clearTimeout(timer)
  }
}
