import { describe, expect, it } from 'vitest'
import type { ThemeTokens } from '@im-ppt/schema'
import { pxToInch, pxToPt, resolveColor, fontSizePt } from '../src/index.js'

const tokens: ThemeTokens = {
  colors: {
    primary: '#4F46E5', secondary: '#64748B', accent: '#06B6D4',
    background: '#F8FAFC', surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#475569',
  },
  fonts: { heading: 'Arial', body: 'Arial' },
  fontSizes: { display: 44, title: 30, subtitle: 20, body: 15, caption: 11 },
}

describe('단위 변환 (가상 캔버스 → PPTX)', () => {
  it('96px = 1inch', () => {
    expect(pxToInch(96)).toBe(1)
    expect(pxToInch(1280)).toBeCloseTo(13.333, 2)
  })
  it('1px = 0.75pt', () => {
    expect(pxToPt(44)).toBe(33)
  })
})

describe('resolveColor', () => {
  it('token 참조를 테마 값으로 해석하고 #을 제거', () => {
    expect(resolveColor('token:colors.primary', tokens)).toBe('4F46E5')
  })
  it('hex 리터럴의 #을 제거', () => {
    expect(resolveColor('#FF0000', tokens)).toBe('FF0000')
  })
  it('알 수 없는 토큰은 textPrimary 폴백', () => {
    expect(resolveColor('token:colors.bogus', tokens)).toBe('0F172A')
  })
})

describe('fontSizePt', () => {
  it('role을 테마 스케일로 해석(pt)', () => {
    expect(fontSizePt(tokens, 'display', undefined)).toBe(33) // 44px * 0.75
  })
  it('style.fontSize 오버라이드 우선', () => {
    expect(fontSizePt(tokens, 'body', 40)).toBe(30)
  })
})
