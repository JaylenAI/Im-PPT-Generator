import { describe, it, expect } from 'vitest'
import { fitFontSize } from '../src/index.js'

describe('fitFontSize (오버플로 자동수정)', () => {
  it('짧은 텍스트는 원래 크기 유지', () => {
    const fs = fitFontSize({ text: '요약', frameW: 600, frameH: 200, fontSize: 32 })
    expect(fs).toBe(32)
  })

  it('긴 텍스트는 프레임에 맞게 축소', () => {
    const long = '이것은 아주 길고 장황한 문장으로 좁은 프레임에는 절대 32px 크기로 들어갈 수 없는 매우 긴 한국어 텍스트입니다. '.repeat(4)
    const fs = fitFontSize({ text: long, frameW: 300, frameH: 120, fontSize: 32 })
    expect(fs).toBeLessThan(32)
    expect(fs).toBeGreaterThanOrEqual(10)
  })

  it('minFontSize 아래로는 내려가지 않음', () => {
    const huge = '가'.repeat(2000)
    const fs = fitFontSize({ text: huge, frameW: 100, frameH: 50, fontSize: 40, minFontSize: 12 })
    expect(fs).toBe(12)
  })

  it('빈 텍스트/0 프레임은 원래 크기', () => {
    expect(fitFontSize({ text: '', frameW: 100, frameH: 100, fontSize: 24 })).toBe(24)
    expect(fitFontSize({ text: 'x', frameW: 0, frameH: 100, fontSize: 24 })).toBe(24)
  })
})
