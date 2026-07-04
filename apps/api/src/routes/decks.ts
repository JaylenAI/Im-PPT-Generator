import { Hono } from 'hono'
import { z } from 'zod'
import { resolveGenerationConfig } from '@im-ppt/schema'
import { generateDeck } from '@im-ppt/core'
import type { AppDeps } from '../deps.js'

const createBody = z.object({ prompt: z.string().min(1) }).passthrough()

/**
 * 덱 라우트 — 생성/조회. 생성은 P1에서 동기(잡큐+SSE는 P2).
 * 핸들러는 얇게: 검증 → core 호출 → 저장 → 응답.
 */
export function deckRoutes(deps: AppDeps) {
  return new Hono()
    .post('/', async (c) => {
      const body = await c.req.json().catch(() => null)
      const parsed = createBody.safeParse(body)
      if (!parsed.success) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'prompt는 필수입니다' } }, 400)
      }
      let config
      try {
        config = resolveGenerationConfig(parsed.data as { prompt: string })
      } catch (e) {
        return c.json(
          { error: { code: 'VALIDATION_FAILED', message: (e as Error).message } },
          400,
        )
      }
      const { deck, costUsd } = await generateDeck(config, {
        registry: deps.registry,
        prompts: deps.prompts,
      })
      deps.decks.put(deck)
      return c.json({ data: { deckId: deck.id, deck, costUsd } }, 201)
    })
    .get('/', (c) => c.json({ data: deps.decks.list() }))
    .get('/:id', (c) => {
      const deck = deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      return c.json({ data: deck })
    })
    .delete('/:id', (c) => {
      const ok = deps.decks.delete(c.req.param('id'))
      if (!ok) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      return c.json({ data: { deleted: true } })
    })
}
