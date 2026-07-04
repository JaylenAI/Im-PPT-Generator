import { Hono } from 'hono'
import { z } from 'zod'
import { outlineSchema, factSchema, userSourceInputSchema } from '@im-ppt/schema'
import { generateOutline, generatePlans } from '@im-ppt/core'
import type { AppDeps } from '../deps.js'
import { buildConfig } from '../lib/build-config.js'
import { runResearchForConfig } from '../lib/research-runner.js'

const outlineBody = z
  .object({ prompt: z.string().min(1), sources: z.array(userSourceInputSchema).optional() })
  .passthrough()

const plansBody = z
  .object({
    prompt: z.string().min(1),
    outline: outlineSchema,
    facts: z.array(factSchema).optional(),
  })
  .passthrough()

/**
 * HITL 게이트 미리보기 — 생성 전에 아웃라인/슬라이드별 계획을 보고받고 승인하는 단계.
 * 클라이언트가 게이트를 오케스트레이션(무상태): outline → (승인) → plans → (승인) → generate.
 * POST /decks/outline : 리서치(+팩트) + 아웃라인 초안
 * POST /decks/plans   : 아웃라인의 슬라이드별 계획(designIntent+contentSummary) — 시장 공백 차별화
 */
export function planningRoutes(deps: AppDeps) {
  return new Hono()
    .post('/decks/outline', async (c) => {
      const parsed = outlineBody.safeParse(await c.req.json().catch(() => null))
      if (!parsed.success) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'prompt 필수' } }, 400)
      }
      let config
      try {
        config = buildConfig(deps.settings.getApp(), parsed.data as Record<string, unknown>)
      } catch (e) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: (e as Error).message } }, 400)
      }
      const research = await runResearchForConfig(deps, config, parsed.data.sources ?? [])
      const { outline } = await generateOutline(
        config,
        { registry: deps.registry, prompts: deps.prompts },
        { facts: research?.facts ?? [] },
      )
      return c.json({
        data: { outline, sources: research?.sources ?? [], facts: research?.facts ?? [] },
      })
    })
    .post('/decks/plans', async (c) => {
      const parsed = plansBody.safeParse(await c.req.json().catch(() => null))
      if (!parsed.success) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'prompt·outline 필수' } }, 400)
      }
      let config
      try {
        config = buildConfig(deps.settings.getApp(), parsed.data as Record<string, unknown>)
      } catch (e) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: (e as Error).message } }, 400)
      }
      const { plans, costUsd } = await generatePlans(
        config,
        parsed.data.outline,
        { registry: deps.registry, prompts: deps.prompts },
        { facts: parsed.data.facts ?? [] },
      )
      return c.json({ data: { plans, costUsd } })
    })
}
