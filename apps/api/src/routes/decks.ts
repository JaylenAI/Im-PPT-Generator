import { Hono } from 'hono'
import { z } from 'zod'
import { generateDeck, editSlide, replaceSlide, checkAccessibility, translateDeck, rewriteDeck, generateVariants, generateSpeakerNotes, generateAudienceQuestions, type ResearchInput } from '@im-ppt/core'
import { getTheme } from '@im-ppt/templates'
import { userSourceInputSchema, outlineSchema, sourceSchema, factSchema, deckSchema } from '@im-ppt/schema'
import type { AppDeps } from '../deps.js'
import { buildConfig } from '../lib/build-config.js'
import { runResearchForConfig } from '../lib/research-runner.js'
import { applyBrandKit } from '../lib/brand.js'
import { newDeckId } from '../lib/ids.js'
import { parseCsvToChart, buildChartDeck } from '../lib/csv-chart.js'

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
      const gen = await generateDeck(
        config,
        { registry: deps.registry, prompts: deps.prompts },
        {
          ...(research ? { research } : {}),
          ...(parsed.data.outline ? { outline: parsed.data.outline } : {}),
        },
      )
      const deck = applyBrandKit(deps, gen.deck)
      await deps.decks.put(deck)
      return c.json({ data: { deckId: deck.id, deck, costUsd: gen.costUsd } }, 201)
    })
    // CSV → 차트 슬라이드 덱(P7) — 첫 열 라벨, 나머지 열 계열
    .post('/from-csv', async (c) => {
      const body = (await c.req.json().catch(() => null)) as
        | { csv?: string; title?: string; chartType?: string }
        | null
      if (!body?.csv || body.csv.trim().length === 0) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'csv 필수' } }, 400)
      }
      try {
        const data = parseCsvToChart(body.csv)
        const deck = buildChartDeck(data, {
          ...(body.title ? { title: body.title } : {}),
          ...(body.chartType ? { chartType: body.chartType } : {}),
        })
        await deps.decks.put(deck)
        return c.json({ data: { deckId: deck.id, deck } }, 201)
      } catch (e) {
        return c.json({ error: { code: 'PARSE_FAILED', message: (e as Error).message } }, 400)
      }
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
    // AI 스피커 노트(P9) — 전 슬라이드 발표자 노트 생성. 제자리 갱신
    .post('/:id/speaker-notes', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      try {
        const updated = await generateSpeakerNotes(deck, { registry: deps.registry, prompts: deps.prompts })
        await deps.decks.put(updated)
        return c.json({ data: { deck: updated } })
      } catch (e) {
        return c.json({ error: { code: 'INTERNAL', message: (e as Error).message } }, 400)
      }
    })
    // 예상 청중 질문(P10)
    .get('/:id/questions', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      try {
        const questions = await generateAudienceQuestions(deck, { registry: deps.registry, prompts: deps.prompts })
        return c.json({ data: { questions } })
      } catch (e) {
        return c.json({ error: { code: 'INTERNAL', message: (e as Error).message } }, 400)
      }
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
    // 덱 리라이트(P10) — 톤/길이 등 지시를 전 슬라이드에 적용. 원본 보존, 새 덱
    .post('/:id/rewrite', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      const body = (await c.req.json().catch(() => null)) as { instruction?: string } | null
      if (!body?.instruction || body.instruction.trim().length === 0) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'instruction 필수' } }, 400)
      }
      try {
        const rewritten = await rewriteDeck(deck, body.instruction, {
          registry: deps.registry,
          prompts: deps.prompts,
        })
        await deps.decks.put(rewritten)
        return c.json({ data: { deckId: rewritten.id, deck: rewritten } }, 201)
      } catch (e) {
        return c.json({ error: { code: 'INTERNAL', message: (e as Error).message } }, 400)
      }
    })
    // 덱 복제(P6) — 원본 그대로 새 ID로 사본 생성(변형 시작점)
    .post('/:id/duplicate', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      const copy = { ...deck, id: newDeckId(), title: `${deck.title} (사본)`, version: 1 }
      await deps.decks.put(copy)
      return c.json({ data: { deckId: copy.id, deck: copy } }, 201)
    })
    // 디자인 변형(P8) — 같은 내용을 다른 레이아웃 N개로 재생성해 선택지 제공
    .post('/:id/slides/:slideId/variants', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      try {
        const { variants, costUsd } = await generateVariants(deck, c.req.param('slideId'), {
          registry: deps.registry,
          prompts: deps.prompts,
        })
        return c.json({ data: { variants, costUsd } })
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
