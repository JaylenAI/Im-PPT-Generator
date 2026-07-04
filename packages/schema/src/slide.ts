import { z } from 'zod'
import { colorSchema, idSchema } from './primitives.js'
import { slideElementSchema } from './elements.js'

export const slideBackgroundSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('color'), color: colorSchema }),
  z.object({ kind: z.literal('image'), src: z.string().min(1), overlayOpacity: z.number().min(0).max(1).default(0) }),
  z.object({
    kind: z.literal('gradient'),
    from: colorSchema,
    to: colorSchema,
    angle: z.number().min(0).max(360).default(135),
  }),
])

/** 슬라이드별 AI 제작 계획 — 생성 전 유저에게 보고/승인받는 HITL 단위 */
export const slidePlanSchema = z.object({
  layoutType: z.string().min(1),
  designIntent: z.string().min(1),
  contentSummary: z.string().min(1),
  factIds: z.array(idSchema).default([]),
})

export const slideStatusSchema = z.enum(['planned', 'generating', 'draft', 'approved'])

export const slideSchema = z.object({
  id: idSchema,
  /** templates 패키지 레이아웃 레지스트리의 키 */
  layoutType: z.string().min(1),
  background: slideBackgroundSchema.optional(),
  elements: z.array(slideElementSchema).default([]),
  notes: z.string().default(''),
  citationIds: z.array(idSchema).default([]),
  status: slideStatusSchema.default('planned'),
  plan: slidePlanSchema.optional(),
})

export type SlideBackground = z.infer<typeof slideBackgroundSchema>
export type SlidePlan = z.infer<typeof slidePlanSchema>
export type Slide = z.infer<typeof slideSchema>
