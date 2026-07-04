import { z } from 'zod'
import { idSchema } from './primitives.js'

/** 아웃라인 섹션 = 슬라이드 1장 후보 — 유저가 편집/재정렬/삭제 후 확정(HITL 게이트) */
export const outlineSectionSchema = z.object({
  id: idSchema,
  /** 짧은 라벨(썸네일/네비게이션용) */
  title: z.string().min(1),
  /** Action Title(ADR-009) — 슬라이드 헤드라인이 되는 완결된 결론 문장. 없으면 title 폴백 */
  assertion: z.string().optional(),
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
