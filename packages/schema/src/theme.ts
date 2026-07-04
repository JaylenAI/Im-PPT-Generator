import { z } from 'zod'
import { idSchema } from './primitives.js'

const hexSchema = z.string().regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)

/** 테마 색상 토큰 — 슬라이드 요소가 `token:colors.<key>`로 참조 */
export const themeColorsSchema = z.object({
  primary: hexSchema,
  secondary: hexSchema,
  accent: hexSchema,
  background: hexSchema,
  surface: hexSchema,
  textPrimary: hexSchema,
  textSecondary: hexSchema,
  success: hexSchema.optional(),
  warning: hexSchema.optional(),
  error: hexSchema.optional(),
})

/** PPTX export 충실도를 위해 폰트는 이름 참조 — 안전 폰트 세트 검증은 exporter 책임 */
export const themeFontsSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
  mono: z.string().min(1).optional(),
})

export const themeTokensSchema = z.object({
  colors: themeColorsSchema,
  fonts: themeFontsSchema,
  /** 타이포 스케일(px) — 렌더러/익스포터 공용 */
  fontSizes: z.object({
    display: z.number().positive(),
    title: z.number().positive(),
    subtitle: z.number().positive(),
    body: z.number().positive(),
    caption: z.number().positive(),
  }),
})

export const themeSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  tokens: themeTokensSchema,
})

export type ThemeColors = z.infer<typeof themeColorsSchema>
export type ThemeTokens = z.infer<typeof themeTokensSchema>
export type Theme = z.infer<typeof themeSchema>
