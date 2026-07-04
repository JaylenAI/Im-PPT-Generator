import { z } from 'zod'
import { aspectRatioSchema, idSchema } from './primitives.js'
import { slideSchema } from './slide.js'
import { outlineSchema } from './outline.js'
import { citationSchema, sourceSchema } from './research.js'
import { themeTokensSchema } from './theme.js'

/** 덱 = 프레젠테이션 1개의 완전한 상태 — 렌더러/익스포터/에이전트가 공유하는 단일 진실 */
export const deckSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  language: z.string().min(2).default('ko'),
  aspectRatio: aspectRatioSchema.default('16:9'),
  themeId: idSchema,
  /** 브랜드킷이 적용된 인라인 테마 토큰(있으면 themeId보다 우선) — 덱이 자기 테마 소유 */
  themeOverride: themeTokensSchema.optional(),
  templateId: idSchema.optional(),
  outline: outlineSchema.optional(),
  slides: z.array(slideSchema).default([]),
  sources: z.array(sourceSchema).default([]),
  citations: z.array(citationSchema).default([]),
  version: z.number().int().positive().default(1),
})

export type Deck = z.infer<typeof deckSchema>
