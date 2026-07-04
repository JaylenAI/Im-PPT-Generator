import { z } from 'zod'
import { themeTokensSchema, type ThemeTokens } from './theme.js'

const hex = z.string().regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)

/**
 * 브랜드킷(P6) — 테마 토큰의 부분 오버라이드. 지정한 색/폰트만 덮어쓴다.
 * 생성 시 선택된 테마 토큰 위에 병합해 deck.themeOverride로 실린다(정적 테마 레지스트리
 * 불변, 덱이 자기 테마를 소유 — 동적 테마 저장 인프라 불필요).
 */
export const brandKitSchema = z.object({
  colors: z
    .object({
      primary: hex.optional(),
      secondary: hex.optional(),
      accent: hex.optional(),
      background: hex.optional(),
      surface: hex.optional(),
      textPrimary: hex.optional(),
      textSecondary: hex.optional(),
    })
    .partial()
    .optional(),
  fonts: z
    .object({ heading: z.string().min(1).optional(), body: z.string().min(1).optional() })
    .partial()
    .optional(),
})
export type BrandKit = z.infer<typeof brandKitSchema>

/** 브랜드킷을 기본 테마 토큰에 병합 — 지정 값만 오버라이드, 나머지는 base 유지 */
export function mergeBrandKit(base: ThemeTokens, kit: BrandKit): ThemeTokens {
  return themeTokensSchema.parse({
    ...base,
    colors: { ...base.colors, ...(kit.colors ?? {}) },
    fonts: { ...base.fonts, ...(kit.fonts ?? {}) },
  })
}
