import { z } from 'zod'
import { aspectRatioSchema, idSchema } from './primitives.js'
import { themeTokensSchema } from './theme.js'

export const templateCategorySchema = z.enum([
  'business',
  'education',
  'creative',
  'tech',
  'minimal',
])

/**
 * 템플릿 출처:
 * - builtin: 코드 레지스트리(`packages/templates`) 제공
 * - user: 사용자가 덱 스타일을 저장하거나 갤러리에서 만든 것(DB 저장)
 * - imported_pptx: 사용자 PPTX 업로드에서 추출(P6, DB 저장)
 * - imported_url: 브랜드 사이트 URL에서 색/폰트 추출(P12 브랜드 매칭, DB 저장)
 */
export const templateSourceSchema = z.enum(['builtin', 'user', 'imported_pptx', 'imported_url'])

/** 템플릿 = 테마(토큰) + 지원 레이아웃 변형 세트 — 갤러리 노출 메타 */
export const templateMetaSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  category: templateCategorySchema,
  themeId: idSchema,
  aspectRatios: z.array(aspectRatioSchema).min(1),
  layoutTypes: z.array(z.string().min(1)).min(1),
  previewUrl: z.string().optional(),
  source: templateSourceSchema.default('builtin'),
  /** user/imported_pptx만 소유. builtin은 전역 */
  workspaceId: z.string().optional(),
  createdAt: z.string().datetime().optional(),
})

/**
 * 사용자 저장/추출 템플릿의 전체 정의 — 갤러리 메타에 더해 실제 테마 토큰을 인라인 소유.
 * builtin은 코드가 테마를 소유하지만, user/imported는 DB가 테마를 소유해야 하므로 토큰을 함께 저장.
 */
export const customTemplateSchema = templateMetaSchema.extend({
  source: z.enum(['user', 'imported_pptx', 'imported_url']),
  workspaceId: z.string().min(1),
  themeTokens: themeTokensSchema,
  /** imported_pptx는 원본 파일, imported_url은 원본 URL 참조(추출 재현/디버깅용) */
  sourceFileRef: z.string().optional(),
})

export type TemplateCategory = z.infer<typeof templateCategorySchema>
export type TemplateSource = z.infer<typeof templateSourceSchema>
export type TemplateMeta = z.infer<typeof templateMetaSchema>
export type CustomTemplate = z.infer<typeof customTemplateSchema>
