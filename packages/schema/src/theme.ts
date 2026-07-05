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

/**
 * 디자인 시스템 스타일 — 색/폰트를 넘어 "골격"을 결정하는 파라미터.
 * 레이아웃 후처리(decorate)가 읽어 대문자 헤딩·타이틀 액센트·배경 장식·헤어라인 등을 적용한다.
 * optional — 없으면 장식 없이 기존(플랫) 렌더(하위호환).
 */
export const themeStyleSchema = z.object({
  /** 디자인 시스템 id(design-systems 레지스트리 키) — 디버깅/매핑용 */
  system: z.string().min(1),
  /** 헤딩 대문자화(스위스/브루탈리즘/바우하우스) */
  headingCase: z.enum(['none', 'upper']).default('none'),
  /** 헤딩 자간(타이트한 모던 vs 넓은 에디토리얼) */
  headingTracking: z.enum(['tight', 'normal', 'wide']).default('normal'),
  /** 타이틀 옆/아래 액센트 장식 */
  titleAccent: z.enum(['bar', 'sidebar', 'underline', 'block', 'none']).default('bar'),
  /** 제목 위 작은 키커(모노 라벨/규칙선) */
  kicker: z.enum(['none', 'mono', 'rule']).default('none'),
  /** 슬라이드 배경 처리 */
  background: z.enum(['flat', 'grid', 'gradient', 'watermark', 'ruled']).default('flat'),
  /** 콘텐츠 표면(카드/코드블록/아웃라인) — 기존 rect 표면에 적용 */
  surface: z.enum(['flat', 'card', 'codeblock', 'outline']).default('flat'),
  /** 모서리 반경(px) — 표면/도형에 적용 */
  radius: z.number().min(0).max(40).default(8),
  /** 보더/헤어라인 굵기 */
  border: z.enum(['none', 'hairline', 'bold']).default('none'),
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
  /** 디자인 시스템 스타일(P11) — optional, 하위호환 */
  style: themeStyleSchema.optional(),
})

export const themeSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  tokens: themeTokensSchema,
})

export type ThemeColors = z.infer<typeof themeColorsSchema>
export type ThemeStyle = z.infer<typeof themeStyleSchema>
export type ThemeTokens = z.infer<typeof themeTokensSchema>
export type Theme = z.infer<typeof themeSchema>
