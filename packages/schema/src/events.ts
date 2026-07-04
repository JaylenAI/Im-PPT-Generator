import { z } from 'zod'
import { idSchema } from './primitives.js'
import { outlineSchema } from './outline.js'
import { slidePlanSchema, slideSchema } from './slide.js'
import { factSchema, sourceSchema } from './research.js'
import { deckSchema } from './deck.js'

/**
 * 생성 파이프라인 SSE 이벤트 계약 — "AI가 실시간으로 만드는 모습"의 단위.
 * 토큰이 아니라 의미 단위로 스트리밍한다.
 */
export const generationEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('job_started'), jobId: idSchema, deckId: idSchema }),
  z.object({ type: z.literal('research_started'), query: z.string() }),
  z.object({ type: z.literal('source_found'), source: sourceSchema }),
  z.object({ type: z.literal('facts_extracted'), facts: z.array(factSchema) }),
  z.object({
    type: z.literal('gate_waiting'),
    gate: z.enum(['facts', 'outline', 'slide_plan']),
    slideId: idSchema.optional(),
  }),
  z.object({ type: z.literal('outline_ready'), outline: outlineSchema }),
  z.object({ type: z.literal('slide_plan_ready'), slideId: idSchema, plan: slidePlanSchema }),
  z.object({ type: z.literal('slide_started'), slideId: idSchema, index: z.number().int().min(0) }),
  /** 부분 슬라이드 JSON — 렌더러가 그리면서 채우는 실시간 뷰의 재료 */
  z.object({ type: z.literal('slide_delta'), slideId: idSchema, patch: z.unknown() }),
  z.object({ type: z.literal('slide_done'), slideId: idSchema, slide: slideSchema }),
  z.object({ type: z.literal('deck_done'), deckId: idSchema }),
  /** 덱이 영속 저장 완료 — 클라이언트가 최종 덱을 받아 에디터로 이동 */
  z.object({ type: z.literal('deck_saved'), deckId: idSchema, deck: deckSchema }),
  z.object({ type: z.literal('export_ready'), format: z.enum(['pptx', 'pdf']), url: z.string() }),
  z.object({ type: z.literal('job_error'), message: z.string(), code: z.string().optional() }),
])

export type GenerationEvent = z.infer<typeof generationEventSchema>
