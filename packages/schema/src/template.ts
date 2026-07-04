import { z } from 'zod'
import { aspectRatioSchema, idSchema } from './primitives.js'

export const templateCategorySchema = z.enum([
  'business',
  'education',
  'creative',
  'tech',
  'minimal',
])

/** 템플릿 = 테마(토큰) + 지원 레이아웃 변형 세트 — 갤러리 노출 메타 */
export const templateMetaSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  category: templateCategorySchema,
  themeId: idSchema,
  aspectRatios: z.array(aspectRatioSchema).min(1),
  layoutTypes: z.array(z.string().min(1)).min(1),
  previewUrl: z.string().optional(),
})

export type TemplateCategory = z.infer<typeof templateCategorySchema>
export type TemplateMeta = z.infer<typeof templateMetaSchema>
