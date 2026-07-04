import { z } from 'zod'
import { idSchema } from './primitives.js'

/** 리서치 소스 — 유저 제공(url/text/문서) + AI 웹서치 결과 모두 동일 스키마 */
export const sourceSchema = z.object({
  id: idSchema,
  kind: z.enum(['web', 'document', 'user_url', 'user_text']),
  title: z.string().min(1),
  url: z.string().url().optional(),
  publisher: z.string().optional(),
  retrievedAt: z.string().datetime().optional(),
})

/** 소스에서 추출된 팩트 — 승인 게이트(할루시네이션 제로)의 단위 */
export const factSchema = z.object({
  id: idSchema,
  sourceId: idSchema,
  kind: z.enum(['statistic', 'insight', 'quote', 'visual']),
  statement: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  /** 승인 시 어느 슬라이드에 반영할지 힌트(선택) */
  slideHint: z.string().optional(),
})

/** 슬라이드 요소가 참조하는 인용 — 소스로 역추적 가능 */
export const citationSchema = z.object({
  id: idSchema,
  sourceId: idSchema,
  label: z.string().min(1),
  url: z.string().url().optional(),
})

export type Source = z.infer<typeof sourceSchema>
export type Fact = z.infer<typeof factSchema>
export type Citation = z.infer<typeof citationSchema>
