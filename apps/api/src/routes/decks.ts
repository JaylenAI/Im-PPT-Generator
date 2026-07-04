import { Hono } from 'hono'
import { z } from 'zod'
import { generateDeck, editSlide, replaceSlide, checkAccessibility, translateDeck, type ResearchInput } from '@im-ppt/core'
import { getTheme } from '@im-ppt/templates'
import { userSourceInputSchema, outlineSchema, sourceSchema, factSchema, deckSchema } from '@im-ppt/schema'
import type { AppDeps } from '../deps.js'
import { buildConfig } from '../lib/build-config.js'
import { runResearchForConfig } from '../lib/research-runner.js'

const createBody = z
  .object({
    prompt: z.string().min(1),
    sources: z.array(userSourceInputSchema).optional(),
    // 게이트 승인 후 재사용(재실행 방지): 승인된 아웃라인 + 이미 계산된 리서치
    outline: outlineSchema.optional(),
    research: z.object({ sources: z.array(sourceSchema), facts: z.array(factSchema) }).optional(),
  })
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
      // 게이트 승인 재사용: 클라이언트가 research를 주면 재실행 안 함. 없으면 새로 리서치.
      let research: ResearchInput | undefined
      if (parsed.data.research) {
        research = {
          sources: parsed.data.research.sources,
          // 거절된 팩트는 반영 안 함(할루시네이션 게이트 결과 존중)
          facts: parsed.data.research.facts.filter((f) => f.status !== 'rejected'),
        }
      } else {
        research = await runResearchForConfig(deps, config, parsed.data.sources ?? [])
      }
      const { deck, costUsd } = await generateDeck(
        config,
        { registry: deps.registry, prompts: deps.prompts },
        {
          ...(research ? { research } : {}),
          ...(parsed.data.outline ? { outline: parsed.data.outline } : {}),
        },
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
    // 수동 편집 저장(WYSIWYG) — 클라이언트가 편집한 덱 전체를 검증 후 저장(version++)
    .patch('/:id', async (c) => {
      const existing = await deps.decks.get(c.req.param('id'))
      if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      const parsed = deckSchema.safeParse(await c.req.json().catch(() => null))
      if (!parsed.success) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: parsed.error.message } }, 400)
      }
      const updated = { ...parsed.data, id: existing.id, version: existing.version + 1 }
      await deps.decks.put(updated)
      return c.json({ data: updated })
    })
    .delete('/:id', async (c) => {
      const ok = await deps.decks.delete(c.req.param('id'))
      if (!ok) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      return c.json({ data: { deleted: true } })
    })
    // 접근성 검사(시장 공백) — 대비율 AA + 이미지 alt 점검
    .get('/:id/accessibility', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      let theme
      try {
        theme = getTheme(deck.themeId)
      } catch (e) {
        return c.json({ error: { code: 'INTERNAL', message: (e as Error).message } }, 400)
      }
      return c.json({ data: checkAccessibility(deck, theme.tokens) })
    })
    // 덱 번역(P10) — 전 슬라이드 텍스트를 대상 언어로. 원본 보존, 새 덱 저장
    .post('/:id/translate', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      const body = (await c.req.json().catch(() => null)) as { language?: string } | null
      if (!body?.language || body.language.trim().length < 2) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'language 필수' } }, 400)
      }
      try {
        const translated = await translateDeck(deck, body.language, {
          registry: deps.registry,
          prompts: deps.prompts,
        })
        await deps.decks.put(translated)
        return c.json({ data: { deckId: translated.id, deck: translated } }, 201)
      } catch (e) {
        return c.json({ error: { code: 'INTERNAL', message: (e as Error).message } }, 400)
      }
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
