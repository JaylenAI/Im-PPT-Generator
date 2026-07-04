import type { ThemeTokens } from '@im-ppt/schema'

/**
 * 가상 캔버스 좌표계 변환 (ADR-005): 96px = 1inch = 72pt.
 * 렌더러(px→CSS)와 익스포터(px→inch/pt)가 같은 캔버스를 공유해 "웹=PPTX"를 보장.
 */
export const PX_PER_INCH = 96
export const PT_PER_PX = 72 / 96 // 0.75

export const pxToInch = (px: number): number => px / PX_PER_INCH
export const pxToPt = (px: number): number => px * PT_PER_PX

/** token:colors.* 또는 hex 리터럴 → PptxGenJS용 hex(# 없이). 미해석 토큰은 textPrimary 폴백 */
export function resolveColor(color: string, tokens: ThemeTokens): string {
  if (color.startsWith('token:colors.')) {
    const key = color.slice('token:colors.'.length) as keyof ThemeTokens['colors']
    const value = tokens.colors[key] ?? tokens.colors.textPrimary
    return value.replace('#', '')
  }
  return color.replace('#', '')
}

type FontRole = 'display' | 'title' | 'subtitle' | 'body' | 'caption'

/** role → 테마 타이포 스케일(px). style.fontSize가 있으면 그것 우선 */
export function fontSizePt(
  tokens: ThemeTokens,
  role: FontRole | undefined,
  overridePx: number | undefined,
): number {
  const px = overridePx ?? (role ? tokens.fontSizes[role] : tokens.fontSizes.body)
  return pxToPt(px)
}

/** display/title은 heading 폰트, 나머지는 body 폰트 */
export function fontFace(tokens: ThemeTokens, role: FontRole | undefined): string {
  return role === 'display' || role === 'title' ? tokens.fonts.heading : tokens.fonts.body
}
