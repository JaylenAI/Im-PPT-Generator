import { Hono } from 'hono'
import { z } from 'zod'
import { generateImage } from '@im-ppt/core'
import { getTheme } from '@im-ppt/templates'
import type { AppDeps } from '../deps.js'
import { fetchStockAsDataUri } from '../lib/stock.js'

const body = z.object({
  concept: z.string().min(1),
  width: z.number().int().positive().max(2000).optional(),
  height: z.number().int().positive().max(2000).optional(),
  themeId: z.string().optional(),
})

const orientationSchema = z.enum(['landscape', 'portrait', 'square'])

/**
 * AI 이미지 생성(P8) — claude -p로 SVG 그래픽 생성 → data URI 반환.
 * 웹/에디터가 이 data URI를 image 요소 src로 넣으면 렌더러·PPTX 모두 표시.
 */
export function imageRoutes(deps: AppDeps) {
  return new Hono()
    // 스톡 이미지 검색(P12) — 키 배선 시 실사진, 없으면 available:false(피커가 "키 미설정" 안내)
    .get('/images/stock', async (c) => {
      const q = c.req.query('q')?.trim()
      if (!q) return c.json({ error: { code: 'VALIDATION_FAILED', message: 'q 필수' } }, 400)
      if (!deps.stockImages) {
        return c.json({ data: { available: false, provider: null, photos: [] } })
      }
      const orientation = orientationSchema.safeParse(c.req.query('orientation'))
      try {
        const photos = await deps.stockImages.search(q, {
          perPage: 12,
          ...(orientation.success ? { orientation: orientation.data } : {}),
        })
        return c.json({ data: { available: true, provider: deps.stockImages.name, photos } })
      } catch (e) {
        return c.json({ error: { code: 'STOCK_FAILED', message: (e as Error).message } }, 502)
      }
    })
    // 선택 스톡 이미지 → data URI(충실한 임베드) — 허용 CDN 호스트만
    .post('/images/stock/fetch', async (c) => {
      const parsed = z
        .object({ url: z.string().url() })
        .safeParse(await c.req.json().catch(() => null))
      if (!parsed.success) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'url 필수' } }, 400)
      }
      try {
        const dataUri = await fetchStockAsDataUri(parsed.data.url)
        return c.json({ data: { dataUri } })
      } catch (e) {
        return c.json({ error: { code: 'FETCH_FAILED', message: (e as Error).message } }, 400)
      }
    })
    // AI SVG 이미지 생성(P8)
    .post('/images/generate', async (c) => {
    const parsed = body.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) {
      return c.json({ error: { code: 'VALIDATION_FAILED', message: 'concept 필수' } }, 400)
    }
    let tokens
    try {
      tokens = parsed.data.themeId ? getTheme(parsed.data.themeId).tokens : undefined
    } catch {
      tokens = undefined
    }
    try {
      const { dataUri, svg } = await generateImage(parsed.data.concept, {
        registry: deps.registry,
        prompts: deps.prompts,
      }, {
        ...(parsed.data.width ? { width: parsed.data.width } : {}),
        ...(parsed.data.height ? { height: parsed.data.height } : {}),
        ...(tokens ? { tokens } : {}),
      })
      return c.json({ data: { dataUri, chars: svg.length } })
    } catch (e) {
      return c.json({ error: { code: 'INTERNAL', message: (e as Error).message } }, 400)
    }
  })
}
