import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { resolveGenerationConfig } from '@im-ppt/schema'
import { generateDeckStreaming } from '@im-ppt/core'
import type { AppDeps } from '../deps.js'

const createBody = z.object({ prompt: z.string().min(1) }).passthrough()

/**
 * 스트리밍 생성 — POST 응답을 text/event-stream으로 흘린다(ADR-004 의미 단위 이벤트).
 * "AI가 실시간으로 슬라이드를 만드는 모습"을 프론트가 소비. 완료 시 덱을 저장하고 deck_saved 방출.
 */
export function streamRoutes(deps: AppDeps) {
  return new Hono().post('/decks/stream', async (c) => {
    const parsed = createBody.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) {
      return c.json({ error: { code: 'VALIDATION_FAILED', message: 'prompt는 필수입니다' } }, 400)
    }
    let config
    try {
      config = resolveGenerationConfig(parsed.data as { prompt: string })
    } catch (e) {
      return c.json({ error: { code: 'VALIDATION_FAILED', message: (e as Error).message } }, 400)
    }

    return streamSSE(c, async (stream) => {
      const send = (event: unknown) => stream.writeSSE({ data: JSON.stringify(event) })
      await send({ type: 'job_started' })
      try {
        const deck = await generateDeckStreaming(config, { registry: deps.registry, prompts: deps.prompts }, send)
        await deps.decks.put(deck)
        await send({ type: 'deck_saved', deckId: deck.id, deck })
      } catch (e) {
        await send({ type: 'job_error', message: (e as Error).message })
      }
    })
  })
}
