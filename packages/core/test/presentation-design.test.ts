import { describe, it, expect } from 'vitest'
import { PRESENTATION_TYPES } from '@im-ppt/schema'
import { hasTheme } from '@im-ppt/templates'

/**
 * P0.6 발표 유형 ↔ 디자인 매칭 — 각 유형의 defaultThemeId가 실제 등록된 테마인지 교차검증.
 * (schema는 leaf라 templates를 참조 못 하므로 core에서 검증)
 */
describe('발표 유형 기본 테마 매칭', () => {
  it('모든 유형의 defaultThemeId가 등록된 테마', () => {
    for (const t of PRESENTATION_TYPES) {
      expect(hasTheme(t.defaultThemeId), `${t.id} → ${t.defaultThemeId}`).toBe(true)
    }
  })

  it('유형별로 서로 다른 테마를 배정(장르 시각 차별화)', () => {
    const themes = PRESENTATION_TYPES.map((t) => t.defaultThemeId)
    expect(new Set(themes).size).toBe(themes.length)
  })
})
