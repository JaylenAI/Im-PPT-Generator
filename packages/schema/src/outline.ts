import { z } from 'zod'
import { idSchema } from './primitives.js'

/** 아웃라인 섹션 = 슬라이드 1장 후보 — 유저가 편집/재정렬/삭제 후 확정(HITL 게이트) */
export const outlineSectionSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  summary: z.string().default(''),
  layoutHint: z.string().optional(),
  factIds: z.array(idSchema).default([]),
})

export const outlineSchema = z.object({
  sections: z.array(outlineSectionSchema).min(1),
  status: z.enum(['draft', 'approved']).default('draft'),
})

export type OutlineSection = z.infer<typeof outlineSectionSchema>
export type Outline = z.infer<typeof outlineSchema>
