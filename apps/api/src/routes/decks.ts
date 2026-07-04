import { Hono } from 'hono'
import { z } from 'zod'
import { generateDeck, editSlide, replaceSlide } from '@im-ppt/core'
import { userSourceInputSchema } from '@im-ppt/schema'
import type { AppDeps } from '../deps.js'
import { buildConfig } from '../lib/build-config.js'
import { runResearchForConfig } from '../lib/research-runner.js'

const createBody = z
  .object({ prompt: z.string().min(1), sources: z.array(userSourceInputSchema).optional() })
  .passthrough()
const editBody = z.object({ instruction: z.string().min(1) })

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
        config = buildConfig(deps.settings.getApp(), parsed.data as Record<string, unknown>)
      } catch (e) {
        return c.json(
          { error: { code: 'VALIDATION_FAILED', message: (e as Error).message } },
          400,
        )
      }
      // 리서치(researchMode != off) → 팩트/인용. off면 undefined
      const research = await runResearchForConfig(deps, config, parsed.data.sources ?? [])
      const { deck, costUsd } = await generateDeck(
        config,
        { registry: deps.registry, prompts: deps.prompts },
        research ? { research } : {},
      )
      await deps.decks.put(deck)
      return c.json({ data: { deckId: deck.id, deck, costUsd } }, 201)
    })
    .get('/', async (c) => c.json({ data: await deps.decks.list() }))
    .get('/:id', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      return c.json({ data: deck })
    })
    .delete('/:id', async (c) => {
      const ok = await deps.decks.delete(c.req.param('id'))
      if (!ok) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      return c.json({ data: { deleted: true } })
    })
    // 페이지 단위 AI 수정 — 선택 슬라이드만 재생성(다른 페이지 불변)
    .post('/:id/slides/:slideId/regenerate', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      const parsed = editBody.safeParse(await c.req.json().catch(() => null))
      if (!parsed.success) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'instruction 필수' } }, 400)
      }
      try {
        const { slide, usage } = await editSlide({
          deck,
          slideId: c.req.param('slideId'),
          instruction: parsed.data.instruction,
          deps: { registry: deps.registry, prompts: deps.prompts },
        })
        const updated = replaceSlide(deck, slide)
        await deps.decks.put(updated)
        return c.json({ data: { slide, deck: updated, costUsd: usage?.costUsd ?? 0 } })
      } catch (e) {
        return c.json({ error: { code: 'INTERNAL', message: (e as Error).message } }, 400)
      }
    })
}
