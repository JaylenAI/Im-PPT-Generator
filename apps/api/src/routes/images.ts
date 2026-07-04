import { Hono } from 'hono'
import { z } from 'zod'
import { generateImage } from '@im-ppt/core'
import { getTheme } from '@im-ppt/templates'
import type { AppDeps } from '../deps.js'

const body = z.object({
  concept: z.string().min(1),
  width: z.number().int().positive().max(2000).optional(),
  height: z.number().int().positive().max(2000).optional(),
  themeId: z.string().optional(),
})

/**
 * AI 이미지 생성(P8) — claude -p로 SVG 그래픽 생성 → data URI 반환.
 * 웹/에디터가 이 data URI를 image 요소 src로 넣으면 렌더러·PPTX 모두 표시.
 */
export function imageRoutes(deps: AppDeps) {
  return new Hono().post('/images/generate', async (c) => {
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
