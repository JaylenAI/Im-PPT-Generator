import { z } from 'zod'
import { aspectRatioSchema, idSchema } from './primitives.js'
import { slideSchema } from './slide.js'
import { outlineSchema } from './outline.js'
import { citationSchema, sourceSchema } from './research.js'

/** 덱 = 프레젠테이션 1개의 완전한 상태 — 렌더러/익스포터/에이전트가 공유하는 단일 진실 */
export const deckSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  language: z.string().min(2).default('ko'),
  aspectRatio: aspectRatioSchema.default('16:9'),
  themeId: idSchema,
  templateId: idSchema.optional(),
  outline: outlineSchema.optional(),
  slides: z.array(slideSchema).default([]),
  sources: z.array(sourceSchema).default([]),
  citations: z.array(citationSchema).default([]),
  version: z.number().int().positive().default(1),
})

export type Deck = z.infer<typeof deckSchema>
