import { describe, expect, it } from 'vitest'
import { brandKitSchema, mergeBrandKit, type ThemeTokens } from '../src/index.js'

const base: ThemeTokens = {
  colors: {
    primary: '#4f46e5', secondary: '#64748b', accent: '#14b8a6',
    background: '#ffffff', surface: '#f8fafc', textPrimary: '#0f172a', textSecondary: '#475569',
  },
  fonts: { heading: 'Geist', body: 'Inter' },
  fontSizes: { display: 48, title: 32, subtitle: 22, body: 18, caption: 14 },
}

describe('mergeBrandKit', () => {
  it('지정한 색/폰트만 오버라이드, 나머지 base 유지', () => {
    const kit = brandKitSchema.parse({ colors: { primary: '#ff0000' }, fonts: { heading: 'Montserrat' } })
    const out = mergeBrandKit(base, kit)
    expect(out.colors.primary).toBe('#ff0000') // 오버라이드
    expect(out.colors.secondary).toBe('#64748b') // 유지
    expect(out.fonts.heading).toBe('Montserrat') // 오버라이드
    expect(out.fonts.body).toBe('Inter') // 유지
    expect(out.fontSizes.display).toBe(48) // 유지
  })

  it('빈 브랜드킷은 base 그대로', () => {
    expect(mergeBrandKit(base, {}).colors.primary).toBe('#4f46e5')
  })

  it('잘못된 hex는 거부', () => {
    expect(brandKitSchema.safeParse({ colors: { primary: 'red' } }).success).toBe(false)
  })
})
