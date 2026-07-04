import { createContext, useContext } from 'react'
import type { ThemeTokens } from '@im-ppt/schema'

/** 렌더 트리에 테마 토큰을 공급 — 요소가 token:colors.* / role을 해석 */
export const ThemeContext = createContext<ThemeTokens | null>(null)

export function useThemeTokens(): ThemeTokens {
  const tokens = useContext(ThemeContext)
  if (!tokens) throw new Error('ThemeContext.Provider 안에서만 렌더 요소를 사용하세요')
  return tokens
}

/** token:colors.* → 테마 hex(#포함). hex 리터럴은 그대로. exporter resolveColor의 CSS판 */
export function resolveCssColor(color: string, tokens: ThemeTokens): string {
  if (color.startsWith('token:colors.')) {
    const key = color.slice('token:colors.'.length) as keyof ThemeTokens['colors']
    return tokens.colors[key] ?? tokens.colors.textPrimary
  }
  return color
}

type FontRole = 'display' | 'title' | 'subtitle' | 'body' | 'caption'

export function fontSizePx(
  tokens: ThemeTokens,
  role: FontRole | undefined,
  overridePx: number | undefined,
): number {
  return overridePx ?? (role ? tokens.fontSizes[role] : tokens.fontSizes.body)
}

export function fontFamily(tokens: ThemeTokens, role: FontRole | undefined): string {
  return role === 'display' || role === 'title' ? tokens.fonts.heading : tokens.fonts.body
}
