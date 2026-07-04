import type { Deck, ThemeTokens } from '@im-ppt/schema'

export interface A11yIssue {
  slideId: string
  slideIndex: number
  elementId?: string
  kind: 'contrast' | 'alt-text'
  severity: 'error' | 'warning'
  detail: string
}

export interface A11yReport {
  issues: A11yIssue[]
  /** 검사한 텍스트/이미지 요소 수 */
  checked: number
  /** 0~100 — 이슈 없으면 100 */
  score: number
}

/** 'token:colors.X' → 실제 hex, 리터럴 hex는 그대로. 해석 불가면 null */
function resolveHex(ref: string | undefined, tokens: ThemeTokens): string | null {
  if (!ref) return null
  if (ref.startsWith('token:colors.')) {
    const key = ref.slice('token:colors.'.length) as keyof ThemeTokens['colors']
    return tokens.colors[key] ?? null
  }
  return /^#[0-9a-fA-F]{3,8}$/.test(ref) ? ref : null
}

/** #rgb/#rrggbb → [r,g,b] (0~255) */
function toRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** WCAG 상대 휘도 */
function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 대비율 (1~21) */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

const AA_NORMAL = 4.5

/**
 * 덱 접근성 검사(시장 공백) — 텍스트 대비율(WCAG AA 4.5:1)과 이미지 alt 텍스트 점검.
 * 색 배경만 대비 계산(그라디언트/이미지 배경은 스킵). 순수 함수 — deck + 테마 토큰만.
 */
export function checkAccessibility(deck: Deck, tokens: ThemeTokens): A11yReport {
  const issues: A11yIssue[] = []
  let checked = 0

  deck.slides.forEach((slide, slideIndex) => {
    // 배경색 결정(색 배경만 대비 검사 대상)
    const bg =
      slide.background?.kind === 'color'
        ? resolveHex(slide.background.color, tokens)
        : slide.background
          ? null // gradient/image 배경은 대비 계산 스킵
          : resolveHex('token:colors.background', tokens)

    for (const el of slide.elements) {
      if (el.type === 'text') {
        checked++
        const fg = resolveHex(el.style.color ?? 'token:colors.textPrimary', tokens)
        if (fg && bg) {
          const ratio = contrastRatio(fg, bg)
          if (ratio < AA_NORMAL) {
            issues.push({
              slideId: slide.id,
              slideIndex,
              elementId: el.id,
              kind: 'contrast',
              severity: 'error',
              detail: `대비율 ${ratio.toFixed(2)}:1 (AA 기준 ${AA_NORMAL}:1 미달)`,
            })
          }
        }
      } else if (el.type === 'image') {
        checked++
        if (!el.alt || el.alt.trim().length === 0) {
          issues.push({
            slideId: slide.id,
            slideIndex,
            elementId: el.id,
            kind: 'alt-text',
            severity: 'warning',
            detail: '이미지에 대체 텍스트(alt)가 없습니다',
          })
        }
      }
    }
  })

  const errors = issues.filter((i) => i.severity === 'error').length
  const warnings = issues.length - errors
  // 에러는 -10, 경고는 -3, 하한 0
  const score = Math.max(0, 100 - errors * 10 - warnings * 3)
  return { issues, checked, score }
}
